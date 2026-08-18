"""
Grounded generation module.
DAY3_SYSTEM_PROMPT, format_citation, build_context, generate_grounded_answer,
and the _simulate_llm_response fallback.
Ported directly from the Day 3 notebook.
"""

import json
import os
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
4. If the evidence does not support a confident answer, set status to
   "Insufficient Evidence", leave supporting_evidence empty, and explain what is missing.
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
6. Never soften or omit a refusal to seem more helpful. Never guess a dosage, threshold,
   or personalized recommendation.
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
    """Build the evidence context block for the LLM prompt."""
    blocks = []
    for c in chunks:
        citation = format_citation(c)
        blocks.append(
            f"EVIDENCE {citation} (similarity={c['score']:.4f})\n"
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
    """Parse JSON from LLM response, handling markdown fences."""
    text = raw_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    return json.loads(text)


def generate_grounded_answer(
    question: str,
    chunks: list[dict],
) -> tuple[dict, str]:
    """
    Generate a grounded answer using the LLM or simulation fallback.
    Returns (response_dict, mode) where mode is "live" or "simulated".
    """
    api_key = os.environ.get("OPEN_ROUTER_KEY", "")

    if api_key:
        try:
            from langchain_openai import ChatOpenAI

            model_name = os.environ.get("OPEN_ROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
            llm = ChatOpenAI(
                model=model_name,
                base_url="https://openrouter.ai/api/v1",
                api_key=api_key,
                temperature=0,
                max_tokens=800,
            )

            context = build_context(chunks)
            prompt = (
                f"{DAY3_SYSTEM_PROMPT}\n\n"
                f"Retrieved evidence:\n{context}\n\n"
                f"Question: {question}\n\n"
                "Respond with the JSON object only."
            )

            raw = llm.invoke(prompt).content
            response = _parse_llm_json(raw)

            # Attach passages from retrieved chunks to evidence items
            chunk_map = {c["chunk_id"]: c["text"] for c in chunks}
            for item in response.get("supporting_evidence", []):
                cid = item.get("citation", {}).get("chunk_id", "")
                if cid in chunk_map:
                    item["passage"] = chunk_map[cid]

            return response, "live"

        except Exception as e:
            print(f"[generation] LLM call failed, falling back to simulation: {e}")
            return _simulate_llm_response(question, chunks), "simulated"
    else:
        return _simulate_llm_response(question, chunks), "simulated"
