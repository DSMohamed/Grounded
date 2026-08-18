# Grounded Insights

Day 4 UI Build Prompt — Clinical Evidence Assistant Frontend

Paste everything below into Claude Code (or another coding agent) to build the actual website.

Prompt to use

You are building the frontend for a clinical decision-support tool called "Grounded" — an evidence-bound RAG assistant for skin cancer prevention counseling, based on the USPSTF guideline. This is Day 4 of a 5-day AI hackathon. The system's entire premise is: fluent ≠ safe. Every design decision should reinforce that this tool shows its work — nothing is asserted without a traceable citation, and the UI must make refusal and uncertainty feel like correct, trustworthy behavior, not failure states.

What already exists (backend logic, in a notebook — you're wrapping it in an API)

The pipeline retrieves chunks from a vector store (Config A: chunk_size=500, overlap=75, top_k=5), then generates a structured JSON response shaped exactly like this:

{
  "status": "Answered | Insufficient Evidence | Safety Refusal",
  "recommendation": "string",
  "supporting_evidence": [
    {
      "claim": "string",
      "citation": {
        "document": "string",
        "section": "string",
        "page": 0,
        "chunk_id": "string"
      }
    }
  ],
  "confidence": "High | Medium | Low | Insufficient Evidence",
  "missing_information": "string",
  "safety_note": "string"
}


Before generation, every query is also run through an input risk classifier with three tiers: Allowed, Needs Caution (patient-specific questions like "do I have melanoma"), Refuse/Redirect (emergencies, out-of-scope topics). Retrieval also carries a similarity score per chunk and a weak_threshold — if the top score is below it, the system refuses before ever calling the LLM.

Build a FastAPI backend that wraps this pipeline (stub the model call with the existing simulation-mode function if no API key is present, exactly like the notebook does) and exposes one endpoint: POST /ask → returns the JSON shape above plus the retrieved evidence chunks (doc/section/page/chunk_id/similarity score) and the risk-classification tier that was applied.

What I need you to build: the frontend

Core screen — the Ask interface

A query box, clearly scoped: placeholder text should hint this is about skin cancer prevention counseling specifically, not general medicine (e.g. "Ask about sun protection, UV exposure, or screening — sourced from the USPSTF guideline").

On submit, show the pipeline actually thinking in stages, not a generic spinner: "Classifying query" → "Retrieving evidence" → "Checking confidence threshold" → "Generating grounded answer" → "Validating citations." This is the whole point of the product — make the process visible.

The answer renders differently depending on status:

Answered — recommendation up top, then each claim in supporting_evidence as its own card with an inline citation chip [Document | Section | Page X | Chunk ID] that expands on click/hover to show the actual retrieved passage underneath the claim, so a user can visually check "does this text support this claim" themselves.

Insufficient Evidence — a visually distinct (not alarming-red, but clearly "this is a boundary, not a bug") state explaining the source doesn't cover this, with a suggestion to rephrase or consult a clinician.

Safety Refusal — distinct again from Insufficient Evidence — this is "we won't answer this kind of question at all," e.g. patient-specific diagnosis requests.

A confidence badge (High/Medium/Low/Insufficient Evidence) that's a first-class visual element, not a small label — this is a clinical trust signal.

An Evidence Panel (toggle or sidebar) showing the raw retrieved chunks before generation — document, section, page, chunk ID, similarity score, and a text preview. This lets a judge see retrieval quality independent of what the LLM did with it.

Persistent, quiet footer disclaimer: this supports, not replaces, clinical judgment — never dismissible, never a modal you have to close.

Secondary screen — Demo Mode Three pre-loaded, one-click scenario buttons matching the Day 5 pitch script:

Case A: Success — a direct question, answered with citations.

Case B: Complex multi-step — a multi-chunk synthesis question.

Case C: Safe refusal — the rehearsed out-of-scope question (breast cancer screening interval), which must visibly trigger "Insufficient Evidence" live.

This screen exists so the team can run the judge demo without typing live.

Design direction — make this NOT look like a generic chat template

Reject the default "blue chat bubble" AI-app look entirely. Direction to take instead:

Treat this like a clinical evidence tool, closer in spirit to a lab report or an annotated legal document than a chatbot — think structured, citation-dense, confident whitespace, not conversational bubbles.

Typography should carry hierarchy: a serif or slab-serif for the recommendation text (gives it "this is a real finding" gravity), monospace for citations and chunk IDs (signals "this is a machine-verifiable pointer, not prose").

Color should encode meaning, not decoration: reserve one strong accent for "Answered/High confidence," a distinct muted tone for "Insufficient Evidence" (not red/error — this is correct behavior, so it shouldn't look broken), and a clearly separate tone for "Safety Refusal."

The evidence-chunk-to-claim link should be an actual visual connector (a highlight, a matched color tag, an expand-in-place) — the "prove it" interaction is the entire value proposition of this app and should be the most polished part of the UI, not an afterthought accordion.

Micro-interactions during the "thinking in stages" sequence should feel procedural and deliberate (each stage checks off) — not playful loading spinners. This is a safety tool; the motion should communicate rigor.

Stack

React + Tailwind for the frontend, FastAPI for the backend wrapper, calling the existing notebook functions. Keep it to a single deployable app so it's ready to demo Wednesday.

Notes for you (not part of the prompt)

I pulled the JSON schema, citation format, confidence levels, and risk-classification tiers directly from your T1_Day3_OpenRouter_Free notebook and the Day 4 slide (Input Risk Classification / Retrieval Confidence Thresholds / Unsupported Claim Detection), so the UI will actually match what your pipeline returns instead of guessing at a shape.

If you want, I can also scaffold the actual FastAPI wrapper around generate_grounded_answer() from your notebook right now, or build the React frontend directly here as a working artifact — just say which one and I'll start.
Backend Integration Prompt — Wire the Notebook into the Website

Paste this into Claude Code (same session as the UI build, or a new one — either works since it references the actual notebook file).

Prompt to use

I have a working Jupyter notebook (T1_Day3_OpenRouter_Free.ipynb) that implements a grounded RAG pipeline for a clinical decision-support tool. I need you to extract this into a proper Python backend module and expose it as an API, then wire the existing frontend to call that API instead of using any mock/simulated data. Do not rewrite the retrieval or generation logic — port it as-is and preserve its exact behavior.

Step 1 — Extract the notebook into a real module

Read through the notebook cells in order and pull out the following into a clean backend/ package (not a single dumped script — separate concerns):

backend/ingest.py — PDF loading, cleaning, chunking (RecursiveCharacterTextSplitter, chunk_size=500, overlap=75 — this is "Config A," the one the notebook selected as final after Day 2 evaluation. Don't default back to the 800/150 baseline.)

backend/index.py — embedding + Chroma vectorstore build/load. Persist the index to disk on first run so the API doesn't re-embed on every restart.

backend/retrieval.py — retrieve_final(question, k=5) using similarity_search_with_relevance_scores, plus the weak_threshold gate value from the notebook.

backend/risk_classifier.py — the PATIENT_SPECIFIC_PATTERNS / DOSAGE_PATTERNS regex-based input classification (Allowed / Needs Caution / Refuse-Redirect).

backend/generation.py — DAY3_SYSTEM_PROMPT, format_citation(), build_context(), generate_grounded_answer(), and the _simulate_llm_response() fallback. Preserve the exact JSON schema fields: status, recommendation, supporting_evidence (each with claim + citation: document/section/page/chunk_id), confidence, missing_information, safety_note.

backend/validation.py — validate_response() and check_invented_citation(), run on every generated answer before it's returned.

Carry over the OpenRouter setup exactly as written: ChatOpenAI pointed at https://openrouter.ai/api/v1, model openai/gpt-oss-20b:free, reading OPEN_ROUTER_KEY from the environment — never hardcode a key, and never prompt for one interactively (getpass was fine in a notebook, it's not fine in a server). If the key isn't set, fall back to _simulate_llm_response() automatically and mark the response with something like "mode": "simulated" so the frontend can show a small "demo mode" indicator instead of pretending it's a live model call.

Step 2 — Build the FastAPI app

backend/main.py:

On startup: build or load the persisted index once (not per-request).

POST /ask — body {"question": str}. Pipeline: classify risk tier → if Refuse/Redirect, short-circuit to a Safety Refusal response without calling retrieval at all → else retrieve → check top score against weak_threshold (short-circuit to Insufficient Evidence if below it, exactly like the notebook's refusal-check function) → else generate → validate → return. Response body should include the full schema above plus risk_tier, retrieved_chunks (document/section/page/chunk_id/similarity score/text preview for every chunk retrieved, not just the ones cited — the frontend's Evidence Panel needs all of them), and decision_path (the same field the notebook already logs, e.g. "weak_retrieval_refused", "answered", "safety_refusal") so the UI can show why a given status was reached.

GET /health — confirms index is loaded and reports whether it's running in live or simulated LLM mode.

Enable CORS for the frontend's origin (localhost dev port, and whatever the deploy URL ends up being).

Wrap the whole /ask handler in a try/except that returns a clean 500 with a message, not a stack trace, so a live judge demo never shows a raw Python traceback on screen.

Step 3 — Connect the frontend

Replace every mock/hardcoded response in the React app with a real call to POST /ask:

Loading stages in the UI ("Classifying query" → "Retrieving evidence" → "Checking confidence threshold" → "Generating grounded answer" → "Validating citations") should map to the actual decision_path / timing of the backend call — if you can't get true incremental server-sent stage updates working before the deadline, at minimum sequence the stage animation to resolve when the single /ask response comes back, don't fake a duration.

The Evidence Panel pulls from retrieved_chunks in the response — real data, not placeholder cards.

The three Demo Mode buttons (Case A/B/C) should call /ask with their real fixed questions rather than replaying a canned response — an actual live call each time, so it's a genuine demo and not a scripted fake.

Handle the simulated-mode flag from /health or the response body by showing a small, honest "running without a live model — showing retrieval + schema logic only" badge, rather than hiding it.

Step 4 — Make it runnable in one command for the demo

Add a README.md with exact setup steps: pip install -r requirements.txt, how/where to set OPEN_ROUTER_KEY, uvicorn backend.main:app --reload, and npm run dev for the frontend. Also add a requirements.txt covering everything the notebook's !pip install cells list (langchain, langchain-community, langchain-text-splitters, langchain-core, pypdf, chromadb, fastembed, langchain-openai, fastapi, uvicorn).

Do not change the grounding rules, the schema, the citation format, or the refusal thresholds from what's in the notebook — the whole point of today is proving the existing pipeline works end-to-end through a real UI, not redesigning the logic.

Notes for you (not part of the prompt)

This assumes the FastAPI/React scaffold from the first prompt already exists (or is being built alongside this). If you haven't built either yet, tell me and I can generate the actual backend module and API here directly instead of just the prompt.

One thing worth deciding before your teammate runs this: whether the vector index gets rebuilt from the PDF on every fresh clone, or whether you commit a pre-built/persisted index so the demo laptop doesn't need to re-embed live. Given you're demoing Thursday, I'd persist it.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ac0cda64-b6df-4184-bf38-e544870c2b2d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
