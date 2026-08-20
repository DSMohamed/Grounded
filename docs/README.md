# 📚 Grounded Documentation Portal
### AI Clinical Decision Support (CDS) Lite Hackathon — Complete Technical Reference

Welcome to the official documentation directory for **Grounded**. This portal organizes the system's architecture, curriculum execution (Days 1 to 5), evaluation metrics, and deployment guides into dedicated technical documents.

---

## 🗂️ Documentation Index

```
docs/
├── README.md                                # Master Documentation Portal
├── 01_ARCHITECTURE_AND_DECISIONS.md        # Architectural Decision Records (ADRs & Why choices)
├── 02_INGESTION_AND_RETRIEVAL.md            # Days 1 & 2: PDF processing, section mapping, Precision@K
├── 03_GROUNDING_AND_GENERATION.md          # Day 3: Strict 7-rule prompt, schema, Groq failover chain
├── 04_SAFETY_GUARDRAILS_AND_EVALUATION.md  # Day 4: 5-layer safety model, citation firewall, test scorecard
├── 05_DEPLOYMENT_AND_DEMO_GUIDE.md          # Day 5: Render, Cloudflare, Flutter mobile & Live Demo script
├── 06_FLUTTER_MOBILE_APP.md                # Mobile Client: Clean Architecture, Riverpod & UI
├── BACKEND_TECHNICAL_DOC.md                # Complete Backend Technical Documentation (English Markdown)
├── BACKEND_TECHNICAL_DOC.html              # Complete Backend Technical Documentation (English HTML)
├── ARABIC_DOCUMENTATION.md                 # التوثيق التقني الكامل للـ Backend (Markdown)
├── ARABIC_DOCUMENTATION.html               # التوثيق التقني للـ Backend (HTML View)
└── DOCUMENTATION.md                        # Complete monolithic all-in-one reference manual
```

---

## 📖 Document Summaries & Quick Links

### 🏛️ [01. Architecture & Architectural Decision Records (ADRs)](./01_ARCHITECTURE_AND_DECISIONS.md)
* **What it covers**: The deep technical "Why" behind every model and framework choice.
* **Key Topics**:
  * Why `BAAI/bge-small-en-v1.5` over OpenAI / MiniLM (33MB, ONNX CPU inference in `<35ms`).
  * Why ChromaDB over FAISS / Pinecone (embedded, zero-config, native metadata co-storage).
  * Why Groq LPU over standard cloud APIs (`~400ms` total synthesis).
  * Why compiled Regex over LLM-based triage (`0.00ms` deterministic execution).
  * Why Config A chunking (500 chars / 75 overlap).

---

### 📥 [02. Ingestion, Section Mapping & Retrieval Tuning](./02_INGESTION_AND_RETRIEVAL.md)
* **What it covers**: Days 1 & 2 curriculum — from raw PDFs to persistent vector search.
* **Key Topics**:
  * Multi-document corpus (USPSTF 2018 Counseling + USPSTF 2023 Screening = 338 chunks).
  * PDF de-hyphenation, text cleaning (`clean_text`), and bibliography stripping.
  * Section-aware mapping (`section_map`) preserving parent guideline context.
  * Dense semantic search benchmarking ($\text{Precision@3} = 0.89$, $\text{Precision@5} = 0.84$).
  * Retrieval failure modes and engineering solutions.

---

### 🧠 [03. Grounded Generation, Citation Integrity & Failover](./03_GROUNDING_AND_GENERATION.md)
* **What it covers**: Day 3 curriculum — prompt engineering, JSON schemas, and resilient multi-provider routing.
* **Key Topics**:
  * Strict 7-rule clinical grounding system prompt.
  * Recommendation / Excerpt / Citation structured JSON schema.
  * Self-healing JSON parser engine (`_parse_llm_json`) with 3-tier repair.
  * Multi-provider priority chain: **Groq LPU (~400ms)** ➔ **OpenRouter (~3.2s)** ➔ **xAI Grok (~1.8s)** ➔ **Simulation (~0ms)**.
  * 5-minute health cooldown cache for dead or rate-limited providers.

---

### 🛡️ [04. Safety Architecture, Guardrails & Evaluation Suite](./04_SAFETY_GUARDRAILS_AND_EVALUATION.md)
* **What it covers**: Day 4 curriculum — defense-in-depth safety and automated clinical benchmarking.
* **Key Topics**:
  * 5-layer clinical safety model (Pre-retrieval triage ➔ Threshold gating ➔ Strict prompt ➔ Post-gen firewall ➔ UX transparency).
  * Pre-retrieval 3-tier risk classifier (`0.00ms` regex triage).
  * Weak-retrieval threshold gating (`score < 0.57`).
  * Post-generation citation integrity firewall (`backend/validation.py`) that detects and strips hallucinated chunk IDs.
  * 20-case automated evaluation benchmark (100% Safety Refusal, 0.0% Unsupported Claims, 100% Citation Validity).

---

### 🚀 [05. Production Deployment, Cross-Platform UI & Demo Guide](./05_DEPLOYMENT_AND_DEMO_GUIDE.md)
* **What it covers**: Day 5 curriculum — cloud infrastructure, mobile integration, and live pitch rehearsal.
* **Key Topics**:
  * Backend deployment on Render (`https://grounded-o09a.onrender.com`).
  * Frontend web app on Cloudflare Pages (`https://grounded-insights.mohamedbuisness2.workers.dev/`).
  * Cross-platform Flutter mobile client with PyNgrok auto-tunneling.
  * **The 3 Core Live Pitch Scenarios** (High-Confidence Answer, 0ms Safety Refusal, and Out-of-Scope Gating).
  * Troubleshooting and cURL health check commands.

---

### 📱 [06. Flutter Mobile Application Architecture](./06_FLUTTER_MOBILE_APP.md)
* **What it covers**: Flutter mobile client architecture, design system, and backend integration.
* **Key Topics**:
  * Clean Architecture structure (`core`, `data`, `domain`, `presentation`).
  * State management with **Riverpod 2.x** and `AsyncNotifier`.
  * DTO models with Freezed immutability & JSON serialization.
  * Dark emerald glassmorphic theme (`AppColors`, `GlassCard`, `AnswerCard`).
  * Dynamic environment injection via `--dart-define=API_BASE_URL=...` and Ngrok tunnels.

---

### 🕸️ Knowledge Graph & Codebase Architecture (Graphify)
* **Interactive Visualization**: [`graphify-out/graph.html`](../graphify-out/graph.html) (open in browser for 2D/3D cluster exploration).
* **Audit & Cohesion Report**: [`graphify-out/GRAPH_REPORT.md`](../graphify-out/GRAPH_REPORT.md) (community breakdown and modularity scores).
* **GraphRAG JSON**: [`graphify-out/graph.json`](../graphify-out/graph.json) (**704 nodes · 1,199 edges · 84 communities**).
* **Top God Nodes**: `cn()` (246 edges), `compilerOptions` (22 edges), `ask_endpoint()` (15 edges), `generate_grounded_answer()` (9 edges), `build_index()` (8 edges).

---

### 📄 [All-in-One Monolithic Reference Manual](./DOCUMENTATION.md)
* The complete unfragmented reference document covering all 5 days in a single printable file.

---

*Authored by Team **El Safe Refusal** for the AI Clinical Decision Support Lite Hackathon.*
