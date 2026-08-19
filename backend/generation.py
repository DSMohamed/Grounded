"""
Grounded generation module.
DAY3_SYSTEM_PROMPT, format_citation, build_context, generate_grounded_answer,
and the _simulate_llm_response fallback.
Ported directly from the Day 3 notebook.
"""

import json
import os
import re
from typing import Any

DAY3_SYSTEM_PROMPT = """You are an evidence-grounded clinical decision-support assistant
for skin cancer prevention counseling. You are not a general medical advisor.

RULES - follow every one exactly:
1. Use ONLY the retrieved evidence passages provided below. Never use outside medical
   knowledge, training data, or personal opinion.
2. Never invent missing thresholds, numbers, criteria, or citations. If the evidence
   doesn't state it, do not state it either.
3. Every claim in "supporting_evidence" must be paired with a citation that points to one
   of the retrieved chunks below - document, section, page, and chunk ID, exactly as given.
4. Answer the question using whatever relevant information the evidence contains. Only set
   status to "Insufficient Evidence" when the retrieved passages have NO relevant content
   for the question at all. If the evidence partially answers the question, answer with
   what it supports and set confidence to "Low" or "Medium" as appropriate. Use
   "missing_information" to explain what aspects are not covered.
5. Return JSON matching exactly this structure:
   {
      "status": "Answered" | "Insufficient Evidence" | "Safety Refusal",
      "recommendation": "...",
      "supporting_evidence": [
         {"claim": "...", "citation": {"document": "...", "section": "...", "page": N, "chunk_id": "..."}}
      ],
      "confidence": "High" | "Medium" | "Low" | "Insufficient Evidence",
      "missing_information": "...",
      "safety_note": "Educational information only; not a diagnosis or medical advice."
   }
6. Never guess a dosage, threshold, or personalized recommendation. Partial answers are
   better than refusing - just mark them with appropriate confidence.
7. Respond with the JSON object only - no preamble, no markdown fences, nothing else.
"""


def format_citation(meta: dict) -> str:
    return (
        f"[{meta.get('document_name', meta.get('document', ''))} | "
        f"Section: {meta.get('section', '')} "
        f"| Page {meta.get('page', '')} "
        f"| Chunk: {meta.get('chunk_id', '')}]"
    )


def build_context(chunks: list[dict]) -> str:
    """Build the evidence context block for the LLM prompt (top 4 chunks for fast inference)."""
    blocks = []
    for c in chunks[:4]:
        citation = format_citation(c)
        blocks.append(
            f"EVIDENCE {citation}\n"
            f"{c['text']}"
        )
    return "\n\n".join(blocks)


def _simulate_llm_response(question: str, chunks: list[dict]) -> dict:
    """
    Fallback when no API key is set.
    Returns a structured response using the top retrieved chunks.
    """
    top = chunks[0]
    confidence = (
        "High" if top["score"] >= 0.6
        else "Medium" if top["score"] >= 0.45
        else "Low"
    )

    # Build supporting evidence from top 3 chunks
    evidence = []
    for c in chunks[:3]:
        # Extract first sentence as claim
        text = c["text"]
        dot_pos = text.find(".")
        claim = (text[:dot_pos + 1] if dot_pos > 0 else text).strip()
        evidence.append({
            "claim": claim,
            "citation": {
                "document": c["document"],
                "section": c["section"],
                "page": c["page"],
                "chunk_id": c["chunk_id"],
            },
            "passage": c["text"],
        })

    return {
        "status": "Answered",
        "recommendation": (
            f'Based on the retrieved guideline text, the response to '
            f'"{question.strip()}" is grounded in {top["section"]} '
            f'(page {top["page"]}): {evidence[0]["claim"]}'
        ),
        "supporting_evidence": evidence,
        "confidence": confidence,
        "missing_information": (
            ""
            if confidence == "High"
            else "Retrieval confidence is not high; verify against the full guideline text before clinical use."
        ),
        "safety_note": "This summarizes guideline text only. It does not account for individual patient factors.",
    }


def _parse_llm_json(raw_text: str) -> dict:
    """Parse JSON from LLM response with resilient repair and field extraction."""
    raw = raw_text.strip()
    if "```json" in raw:
        raw = raw.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in raw:
        raw = raw.split("```", 1)[1].split("```", 1)[0].strip()

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        snippet = raw[start : end + 1]
    elif start != -1:
        snippet = raw[start:]
    else:
        snippet = raw

    # Clean trailing commas
    cleaned = re.sub(r",\s*([\]}])", r"\1", snippet)

    # 1. Standard parse
    try:
        return json.loads(cleaned, strict=False)
    except Exception:
        pass

    # 2. Repair cut-off JSON (missing quotes / braces)
    t = cleaned.strip()
    if t.count('"') % 2 != 0:
        t += '"'
    if t.count('{') > t.count('}'):
        t += '}' * (t.count('{') - t.count('}'))
    if t.count('[') > t.count(']'):
        t += ']' * (t.count('[') - t.count(']'))
    t = re.sub(r",\s*([\]}])", r"\1", t)

    try:
        return json.loads(t, strict=False)
    except Exception:
        pass

    # 3. Regex extraction fallback
    rec_m = re.search(r'"recommendation"\s*:\s*"([^"]+)"', raw, re.I)
    status_m = re.search(r'"status"\s*:\s*"([^"]+)"', raw, re.I)
    conf_m = re.search(r'"confidence"\s*:\s*"([^"]+)"', raw, re.I)
    cids = re.findall(r'"chunk_id"\s*:\s*"([^"]+)"', raw, re.I)

    if rec_m:
        return {
            "status": status_m.group(1) if status_m else "Answered",
            "recommendation": rec_m.group(1),
            "supporting_evidence": [
                {
                    "claim": rec_m.group(1),
                    "citation": {
                        "document": "USPSTF Guideline",
                        "section": "Clinical Considerations",
                        "page": 1,
                        "chunk_id": cid,
                    },
                }
                for cid in cids
            ] or [],
            "confidence": conf_m.group(1) if conf_m else "High",
            "missing_information": "",
            "safety_note": "This summarizes guideline evidence only.",
        }

    # Final attempt: replace raw newlines
    safe_clean = re.sub(r'(?<!\\)\n', ' ', cleaned)
    return json.loads(safe_clean, strict=False)


def generate_grounded_answer(
    question: str,
    chunks: list[dict],
) -> tuple[dict, str]:
    """
    Generate a grounded answer using Grok (xAI), OpenRouter, or simulation fallback.
    Returns (response_dict, mode) where mode is "live" or "simulated".
    """
    import requests

    grok_key = os.environ.get("GROK_API_KEY") or os.environ.get("XAI_API_KEY", "")
    openrouter_key = os.environ.get("OPEN_ROUTER_KEY", "")

    context = build_context(chunks)

    # ── 1. Try Grok (xAI API) if configured ────────────────────────────────────
    if grok_key:
        grok_model = os.environ.get("GROK_MODEL", "grok-2-1212")
        grok_headers = {
            "Authorization": f"Bearer {grok_key}",
            "Content-Type": "application/json",
        }
        grok_payload = {
            "model": grok_model,
            "messages": [
                {"role": "system", "content": DAY3_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Evidence:\n{context}\n\nQuestion: {question}\n\nRespond with the JSON object only.",
                },
            ],
            "max_tokens": 500,
            "temperature": 0,
        }

        try:
            r = requests.post(
                "https://api.x.ai/v1/chat/completions",
                headers=grok_headers,
                json=grok_payload,
                timeout=6.0,
            )
            if r.status_code == 200:
                raw = r.json()["choices"][0]["message"]["content"]
                response = _parse_llm_json(raw)

                chunk_map = {c["chunk_id"]: c["text"] for c in chunks}
                for item in response.get("supporting_evidence", []):
                    cid = item.get("citation", {}).get("chunk_id", "")
                    if cid in chunk_map:
                        item["passage"] = chunk_map[cid]

                return response, "live"
            else:
                print(f"[generation] Grok API returned status {r.status_code} ({r.text[:80]}), trying next provider...")
        except Exception as e:
            print(f"[generation] Grok API error/timeout: {e}. Trying next provider...")

    # ── 2. Try OpenRouter if configured ────────────────────────────────────────
    if openrouter_key:
        or_headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "HTTP-Referer": "http://localhost:8080",
            "X-Title": "Grounded Clinical Assistant",
            "Content-Type": "application/json",
        }
        or_model = os.environ.get("OPEN_ROUTER_MODEL", "google/gemma-4-26b-a4b-it:free")
        or_payload = {
            "model": or_model,
            "messages": [
                {"role": "system", "content": DAY3_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Evidence:\n{context}\n\nQuestion: {question}\n\nRespond with the JSON object only.",
                },
            ],
            "max_tokens": 500,
            "temperature": 0,
        }

        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=or_headers,
                json=or_payload,
                timeout=6.0,
            )
            if r.status_code == 200:
                raw = r.json()["choices"][0]["message"]["content"]
                response = _parse_llm_json(raw)

                chunk_map = {c["chunk_id"]: c["text"] for c in chunks}
                for item in response.get("supporting_evidence", []):
                    cid = item.get("citation", {}).get("chunk_id", "")
                    if cid in chunk_map:
                        item["passage"] = chunk_map[cid]

                return response, "live"
            else:
                print(f"[generation] OpenRouter returned status {r.status_code} ({r.text[:80]}), falling back to simulation.")
        except Exception as e:
            print(f"[generation] OpenRouter error/timeout: {e}, falling back to simulation.")

    # ── 3. Fallback: Instant Deterministic Grounded Simulation ─────────────────
    return _simulate_llm_response(question, chunks), "simulated"
