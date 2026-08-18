# Grounded — Evidence-Bound Clinical Assistant

An evidence-bound RAG assistant for skin cancer prevention counseling, grounded in the USPSTF guideline. Built for the 5-day AI hackathon.

**Premise:** fluent ≠ safe. Every claim carries a traceable citation. Refusal and uncertainty are first-class outcomes, not failure states.

---

## Quick Start (Demo)

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. (Optional) Set your OpenRouter API key

```bash
# Windows PowerShell
$env:OPEN_ROUTER_KEY = "your-key-here"

# Linux/Mac
export OPEN_ROUTER_KEY="your-key-here"
```

If no key is set, the system runs in **simulation mode** — retrieval + schema logic works, but responses are generated without an LLM. A small badge in the UI indicates this.

### 3. Start the FastAPI backend

```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

On first run, the backend builds a ChromaDB vector index from the PDF (takes ~30s). The index is persisted to `chroma_index/` so subsequent starts are instant.

### 4. Start the frontend

```bash
bun install   # or npm install
bun run dev   # or npm run dev
```

The frontend runs on `http://localhost:8080` and calls the FastAPI backend at `http://localhost:8000`.

> **Note:** The frontend works without the backend too — it falls back to a built-in TypeScript simulation. For the full experience with real embeddings, run both.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Frontend (TanStack Start + React + Tailwind)       │
│  localhost:8080                                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌────────────────┐    │
│  │ AskConsole│  │ Evidence │  │ StageTracker   │    │
│  │          │  │  Panel   │  │                │    │
│  └──────────┘  └──────────┘  └────────────────┘    │
└───────────────────────┬─────────────────────────────┘
                        │ POST /ask
                        ▼
┌─────────────────────────────────────────────────────┐
│  FastAPI Backend                                     │
│  localhost:8000                                      │
│                                                      │
│  classify_risk → retrieve → threshold_check →        │
│  generate → validate                                 │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐      │
│  │ ChromaDB │  │ Fastembed│  │  OpenRouter   │      │
│  │  Index   │  │ BGE-small│  │  (optional)   │      │
│  └──────────┘  └──────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────┘
```

## Pipeline

1. **Input Risk Classification** — Regex-based classifier with three tiers:
   - `Allowed` — general guideline questions
   - `Needs Caution` — patient-specific (answered with disclaimer)
   - `Refuse/Redirect` — emergencies, dosage, diagnosis (refused before retrieval)

2. **Retrieval** — ChromaDB similarity search (Config A: chunk_size=500, overlap=75, top_k=5)

3. **Confidence Threshold** — If top similarity score < 0.35, refuses with "Insufficient Evidence"

4. **Grounded Generation** — LLM generates structured JSON with citations, or simulation fallback

5. **Citation Validation** — Every citation is checked against retrieved chunks; invented citations are stripped

## Backend Modules

| Module | Purpose |
|--------|---------|
| `backend/ingest.py` | PDF loading, cleaning, chunking (Config A) |
| `backend/index.py` | Embedding + Chroma vectorstore build/load |
| `backend/retrieval.py` | `retrieve_final()` with similarity scores |
| `backend/risk_classifier.py` | Input risk classification (3 tiers) |
| `backend/generation.py` | System prompt, LLM call, simulation fallback |
| `backend/validation.py` | Schema validation + invented citation detection |
| `backend/main.py` | FastAPI app with `/ask` and `/health` endpoints |

## API Endpoints

### `POST /ask`

```json
{"question": "What does the USPSTF recommend about UV exposure?"}
```

Returns the full pipeline response including status, recommendation, supporting evidence with citations, confidence, retrieved chunks, risk tier, decision path, and validation results.

### `GET /health`

Returns index status and LLM mode (live vs simulated).

## Demo Mode

Navigate to `/demo` in the frontend for three pre-loaded scenarios:

- **Case A — Success**: Direct guideline question → answered with citations
- **Case B — Multi-step synthesis**: Multi-chunk question → synthesized answer
- **Case C — Safe refusal**: Out-of-scope question → "Insufficient Evidence" refusal

Each button issues a real pipeline call — no canned responses.

---

## Tech Stack

- **Frontend**: React, TanStack Start (SSR), Tailwind CSS v4, Radix UI
- **Backend**: FastAPI, LangChain, ChromaDB, Fastembed (BAAI/bge-small-en-v1.5)
- **LLM**: OpenRouter (openai/gpt-oss-20b:free) — optional, simulation fallback
- **Source**: USPSTF Skin Cancer Prevention Behavioral Counseling Guideline (2018)
