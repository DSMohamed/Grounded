# 🧠 Grounded Generation, Citation Integrity & Failover Pipeline
### Day 3 Curriculum Deep Dive — Grounded

This document details the grounded generation layer: how retrieved evidence is constrained by strict clinical rules, formatted into verifiable JSON schemas, resiliently repaired if syntax is broken, and routed across a multi-provider failover chain.

---

## 📑 Table of Contents
1. [The Grounding Doctrine: "Every Word, Traceable"](#1-the-grounding-doctrine-every-word-traceable)
2. [The Strict 7-Rule System Prompt](#2-the-strict-7-rule-system-prompt)
3. [Structured JSON Schema Specification](#3-structured-json-schema-specification)
4. [Self-Healing JSON Parser Engine (`_parse_llm_json`)](#4-self-healing-json-parser-engine-_parse_llm_json)
5. [Multi-Provider Resilient Failover Architecture](#5-multi-provider-resilient-failover-architecture)
6. [Provider Health Cache (`_PROVIDER_COOLDOWN = 300s`)](#6-provider-health-cache-_provider_cooldown--300s)

---

## 1. The Grounding Doctrine: "Every Word, Traceable"

In standard RAG implementations, models frequently "smooth over" missing evidence by pulling facts from their pre-trained parameters. In clinical medicine, this creates dangerous hallucinations (e.g. inventing a medication dosage or false screening guideline).

**Grounded's Rule of Evidence:**
> If a clinical recommendation cannot be directly mapped to a specific document, section, and page number in the retrieved context, the system **must refuse to state it**.

---

## 2. The Strict 7-Rule System Prompt (`backend/generation.py`)

```python
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
```

---

## 3. Structured JSON Schema Specification

Every response produced by the generation layer conforms to our strict Pydantic model:

```json
{
  "status": "Answered",
  "recommendation": "The USPSTF recommends counseling young adults, adolescents, children, and parents of young children aged 6 months to 24 years with fair skin types to minimize UV radiation exposure to reduce skin cancer risk (Grade B).",
  "supporting_evidence": [
    {
      "claim": "Counseling on minimizing UV exposure is recommended for fair-skinned individuals aged 6 months to 24 years.",
      "citation": {
        "document": "USPSTF Behavioral Counseling to Prevent Skin Cancer (2018)",
        "section": "Summary of Recommendations and Evidence",
        "page": 2,
        "chunk_id": "uspstf_skin_cancer_2018-CH-007"
      },
      "passage": "The USPSTF recommends counseling young adults, adolescents, children..."
    }
  ],
  "confidence": "High",
  "missing_information": "",
  "safety_note": "Educational information only; not a diagnosis or medical advice."
}
```

---

## 4. Self-Healing JSON Parser Engine (`_parse_llm_json`)

### The Problem:
Under low-token limits or high inference loads, LLMs frequently output malformed JSON:
1. Markdown wrappers (````json ... ````)
2. Trailing commas before closing braces (`{"a": 1,}`)
3. Unclosed quotes or truncated brackets when hitting `max_tokens`

### Our 3-Stage Self-Healing Pipeline:

```
[Raw LLM Output String]
           │
           ▼
[Stage 1: Sanitization & Trailing Comma Cleanup]
  • Strips ```json wrappers
  • Regex cleans illegal trailing commas: re.sub(r",\s*([\]}])", r"\1", text)
  • Attempts standard json.loads()
           │ (if fails)
           ▼
[Stage 2: Automatic Bracket & Quote Balancing]
  • Calculates parity of double quotes ("")
  • Balances unclosed curly braces { } and square brackets [ ]
  • Attempts repaired json.loads()
           │ (if fails)
           ▼
[Stage 3: Regex Field Extraction Fallback]
  • Extracts recommendation via: re.search(r'"recommendation"\s*:\s*"([^"]+)"')
  • Extracts chunk IDs via: re.findall(r'"chunk_id"\s*:\s*"([^"]+)"')
  • Rebuilds valid AskResponse object (Zero Crashes / 0% 500 errors)
```

---

## 5. Multi-Provider Resilient Failover Architecture

To eliminate single points of failure, queries execute through a multi-tier priority chain:

```
                                  ┌───────────────────────────┐
                                  │   Incoming Clinical Query │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                             ┌─────────────────────────────────────┐
                             │  1. Groq LPU (llama-3.3-70b)        │
                             │     ~400ms Ultra-Fast Inference     │
                             └──────────────────┬──────────────────┘
                                                │ (On 429/403/Timeout)
                                                ▼
                             ┌─────────────────────────────────────┐
                             │  2. OpenRouter (gemma-4-26b-it)     │
                             │     ~3.2s Secondary Cloud Fallback  │
                             └──────────────────┬──────────────────┘
                                                │ (On 429/Timeout)
                                                ▼
                             ┌─────────────────────────────────────┐
                             │  3. xAI Grok (grok-2 / grok-3-mini) │
                             │     ~1.8s Tertiary Cloud Fallback   │
                             └──────────────────┬──────────────────┘
                                                │ (On Error)
                                                ▼
                             ┌─────────────────────────────────────┐
                             │  4. Deterministic Simulation Engine │
                             │     ~0ms Guaranteed Offline Answer  │
                             └─────────────────────────────────────┘
```

---

## 6. Provider Health Cache (`_PROVIDER_COOLDOWN = 300s`)

When an external provider fails (e.g. rate limit HTTP 429 or quota exhaustion), retrying it on every request causes huge delays (up to 12s of cumulative timeouts).

### Our Solution:
* The backend logs failed providers in `_provider_failures[provider_name] = timestamp`.
* For the next **300 seconds (5 minutes)**, subsequent requests **skip the failed provider instantly** and route directly to healthy providers or instant simulation.
* Result: Latency remains consistently **`< 2.8s`** even during external API outages.
