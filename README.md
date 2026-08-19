# 🏥 Grounded — Evidence-Bound Clinical AI Assistant

[![Status](https://img.shields.io/badge/Hackathon-Days_1--4_Verified-10b981.svg)](#-internal-evaluation-scorecard)
[![Accuracy](https://img.shields.io/badge/Safety_Refusal_Accuracy-100%25-blue.svg)](#-internal-evaluation-scorecard)
[![Unsupported Claims](https://img.shields.io/badge/Unsupported_Claims-0.0%25-emerald.svg)](#-internal-evaluation-scorecard)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](#)

> **"Fluent ≠ Safe."**  
> In clinical AI, an unsupported answer is a hazard. **Grounded** is an evidence-bound Clinical Decision Support assistant strictly grounded in the **USPSTF 2018 Skin Cancer Prevention: Behavioral Counseling Guideline**. Every claim is tethered to a verifiable citation, and refusal is treated as a first-class clinical decision.

---

## 🌟 Key Features

* **🔬 Strict Evidence Binding**: Answers are generated exclusively from retrieved guideline chunks. Zero hallucinated claims or invented citations.
* **🛡️ 5-Tier Safety Guardrails**: Pre-generation classifier intercepts emergency symptoms, medication dosage, diagnostic inquiries, and adversarial prompt injections before LLM invocation.
* **📊 Calibrated Threshold Gating**: Automatically refuses out-of-domain queries with *"Insufficient Evidence"* when similarity scores fall below `0.57`.
* **💬 ChatGPT-Style Conversational UX**: Full-featured conversational interface with chat history, radial confidence gauges, and expandable passage drawers.
* **🕵️ Temporary Chat (Incognito Mode)**: Privacy-preserving consultation mode with zero disk persistence or database tracking.
* **☁️ Cloud Sync & Authentication**: Optional Supabase authentication with PostgreSQL database and Row Level Security (RLS) + guest local storage fallback.
* **📱 Fully Mobile Responsive**: Slide-over drawer and touch-friendly interface across all screen sizes.
* **📈 Automated Evaluation Suite**: Built-in 20-case clinical evaluation runner calculating Precision@K, Citation Validity, and Faithfulness.

---

## 📐 System Architecture & Pipeline

```
                              ┌───────────────────────────┐
                              │  Clinical Query Received  │
                              └─────────────┬─────────────┘
                                            │
                                            ▼
                        ┌───────────────────────────────────────┐
                        │   1. Input Risk Classifier (Pre-Gen)  │
                        └───────────────────┬───────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
      [Refuse / Redirect]            [Needs Caution]                 [Allowed]
      Emergency / Dosage /          Patient-Specific             General Guideline
      Diagnosis / Injections         (Add Warning)
               │                            │                            │
               ▼                            └────────────┬───────────────┘
     [SAFETY REFUSAL]                                   │
                                                        ▼
                                        ┌───────────────────────────────┐
                                        │  2. Dense Vector Retrieval    │
                                        │   ChromaDB + BGE-small-en     │
                                        └───────────────┬───────────────┘
                                                        │
                                                        ▼
                                        ┌───────────────────────────────┐
                                        │  3. Retrieval Threshold Gate  │
                                        │     Score < 0.57 Threshold?   │
                                        └───────────────┬───────────────┘
                                                        │
                                        ┌───────────────┴───────────────┐
                                        ▼                               ▼
                                      [YES]                            [NO]
                                        │                               │
                                        ▼                               ▼
                             [INSUFFICIENT EVIDENCE]    ┌───────────────────────────────┐
                                                        │ 4. Grounded LLM Generation    │
                                                        │    Structured JSON Schema     │
                                                        └───────────────┬───────────────┘
                                                                        │
                                                                        ▼
                                                        ┌───────────────────────────────┐
                                                        │ 5. Post-Gen Citation Validator│
                                                        │    Check & Strip Invented CIDs│
                                                        └───────────────┬───────────────┘
                                                                        │
                                                                        ▼
                                                        ┌───────────────────────────────┐
                                                        │   6. Grounded Answer + Cards  │
                                                        └───────────────────────────────┘
```

---

## 📊 Internal Evaluation Scorecard

Our pipeline was benchmarked against a 20-case clinical dataset ([`backend/eval_dataset.json`](file:///e:/MohamedWorks/Hackathon/grounded-insights/backend/eval_dataset.json)) spanning direct guideline queries, multi-chunk synthesis, ambiguous questions, diagnostic requests, emergency symptoms, and adversarial injection attacks:

| Evaluation Metric | Score | Target | Status |
| :--- | :---: | :---: | :---: |
| **Overall Decision Accuracy** | **95.0%** | > 85% | 🟢 Exceeded |
| **Safety Refusal Accuracy** | **100.0%** (9/9) | 100% | 🟢 Perfect |
| **Unsupported Claim Rate** | **0.0%** (0/30) | 0.0% | 🟢 Zero Hallucination |
| **Citation Validity** | **100.0%** (30/30) | 100% | 🟢 Verified |
| **Faithfulness Rate** | **100.0%** | > 95% | 🟢 Perfect |
| **Retrieval Precision@5** | **0.84** | > 0.70 | 🟢 High Relevance |

To run the automated evaluation suite locally:
```bash
python -m backend.evaluation
```

---

## 🛠️ Tech Stack

### Backend
* **Runtime & Framework**: Python 3.11+ / FastAPI / Uvicorn
* **Vector Store**: ChromaDB (102 persistent chunks with document metadata)
* **Embedding Model**: `BAAI/bge-small-en-v1.5` (FastEmbed / HuggingFace)
* **LLM Engine**: OpenRouter API (`google/gemma-4-26b-a4b-it:free` / `nvidia/nemotron-3.5-lightning:free`) with automatic simulation fallback
* **Validation**: Pydantic v2 + custom citation verification

### Frontend
* **Framework**: React 19 + TanStack Start / Vite SSR + Nitro
* **Styling**: Tailwind CSS v4 + Lucide Icons
* **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
* **State Management**: React Query + LocalStorage guest isolation

---

## ⚡ Quick Start

### 1. Clone & Set Up Backend

```bash
# Clone the repository
git clone https://github.com/DSMohamed/grounded-insights.git
cd grounded-insights

# Install Python dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `.env` to include your OpenRouter key:
```env
OPEN_ROUTER_KEY=sk-or-v1-your-openrouter-key
OPEN_ROUTER_MODEL=google/gemma-4-26b-a4b-it:free
```

Start the FastAPI server:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
*API health check will be available at `http://127.0.0.1:8000/health`.*

---

### 2. Set Up Frontend

```bash
# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 🗂️ Project Structure

```
grounded-insights/
├── backend/
│   ├── eval_dataset.json      # 20-case clinical evaluation dataset
│   ├── evaluation.py          # Automated metrics runner (Precision@K, Faithfulness)
│   ├── generation.py          # Strict prompt template & OpenRouter LLM caller
│   ├── index.py               # ChromaDB index manager & BGE embeddings
│   ├── ingest.py              # PDF chunking pipeline (Config A: 500/75)
│   ├── main.py                # FastAPI endpoints (/ask, /health)
│   ├── retrieval.py           # Top-K retrieval & weak threshold gating
│   ├── risk_classifier.py     # Pre-generation regex risk classifier
│   └── validation.py          # Post-generation schema & citation validator
├── src/
│   ├── components/grounded/   # ChatMessage, ChatSidebar, ChatInput, StageTracker
│   ├── lib/
│   │   ├── config.ts          # Centralized API base URL resolver
│   │   ├── grounded.types.ts  # TypeScript types & starter prompts
│   │   └── supabase.ts        # Supabase auth & PostgreSQL sync engine
│   └── routes/
│       ├── __root.tsx         # App root shell
│       ├── index.tsx          # ChatGPT conversational interface
│       ├── auth.tsx           # Cloud Sign In / Sign Up
│       ├── demo.tsx           # Interactive clinical demo cases
│       └── how-it-works.tsx   # Interactive pipeline architecture diagram
├── supabase/
│   └── schema.sql             # PostgreSQL schema with Row Level Security (RLS)
├── Dockerfile                 # Production container definition
├── requirements.txt           # Python dependencies
└── package.json               # Frontend dependencies
```

---

## 🌐 Production Deployment

### 1. Backend (FastAPI on Render / Railway)
1. Create a new **Web Service** on [Render.com](https://render.com) connected to this repository.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables: `OPEN_ROUTER_KEY=sk-or-v1-...`

### 2. Frontend (Vercel / Cloudflare Pages)
1. Import repository into [Vercel](https://vercel.com/new).
2. Set Environment Variables:
   * `VITE_API_URL` = `https://your-backend.onrender.com`
   * `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   * `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
3. Deploy!

---

## 🛡️ Medical Disclaimer
*Grounded is built as an educational demonstration of evidence-bound Clinical Decision Support for the 5-Day AI Hackathon. It does not provide medical diagnoses, treatment selections, or individualized clinical advice. Always consult a licensed healthcare provider for clinical care.*

---

## 👥 Team
* **Team**: +90 Clutch (*El Safe Refusal*)
* **Hackathon**: AI Clinical Decision Support Lite (Wadi AI)
