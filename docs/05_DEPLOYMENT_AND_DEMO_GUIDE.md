# 🚀 Production Deployment, Cross-Platform UI & Demo Guide
### Day 5 Curriculum Deep Dive — Grounded

This document provides complete instructions for deploying Grounded across cloud environments, running the Flutter mobile application, and executing a rehearsed live presentation demo for judges.

---

## 📑 Table of Contents
1. [Production Topology Overview](#1-production-topology-overview)
2. [Backend Deployment (Render Web Service)](#2-backend-deployment-render-web-service)
3. [Frontend Deployment (Cloudflare Pages / TanStack Start)](#3-frontend-deployment-cloudflare-pages--tanstack-start)
4. [Mobile Client (Flutter 3.x with PyNgrok Tunneling)](#4-mobile-client-flutter-3x-with-pyngrok-tunneling)
5. [Live Demo Script: The 3 Core Pitch Scenarios](#5-live-demo-script-the-3-core-pitch-scenarios)
6. [Troubleshooting & Health Checks](#6-troubleshooting--health-checks)

---

## 1. Production Topology Overview

```
                        ┌─────────────────────────────────────────────────────────┐
                        │                LIVE PRODUCTION DEPLOYMENTS              │
                        ├────────────────────────────┬────────────────────────────┤
                        │  Frontend Web App (Cloud)  │  Backend REST API (Cloud)  │
                        │  https://grounded-insights │  https://grounded-o09a     │
                        │  .pages.dev                │  .onrender.com             │
                        └─────────────┬──────────────┴─────────────┬──────────────┘
                                      │                            │
                                      │                            │
                     ┌────────────────┴────────────────────────────┴────────────────┐
                     ▼                                                              ▼
     ┌───────────────────────────────┐                             ┌────────────────────────────────┐
     │   WEB CLIENT (TanStack/Vite)  │                             │   MOBILE CLIENT (Flutter 3.x)  │
     │   • Dark Emerald Aesthetic    │                             │   • Android / iOS / Windows    │
     │   • Radial Confidence Gauges  │                             │   • Dynamic Ngrok / Cloud REST │
     │   • Expandable Citations      │                             │   • Offline Token Cache        │
     └───────────────────────────────┘                             └────────────────────────────────┘
```

---

## 2. Backend Deployment (Render Web Service)

* **Production Endpoint**: `https://grounded-o09a.onrender.com`
* **Blueprint Configuration**: `render.yaml`

```yaml
services:
  - type: web
    name: grounded-backend
    env: python
    region: oregon
    plan: free
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn backend.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: GROQ_API_KEY
        sync: false
      - key: GROQ_MODEL
        value: groq/compound-mini
      - key: OPEN_ROUTER_KEY
        sync: false
```

### Critical Production Endpoints:
* `GET /health`: Returns service health, loaded chunk count (338), and active LLM provider mode (`live (groq)`).
* `POST /ask`: Primary 5-stage clinical decision-support pipeline.
* `GET /docs`: Interactive OpenAPI / Swagger UI.

---

## 3. Frontend Deployment (Cloudflare Pages / TanStack Start)

* **Production URL**: `https://grounded-insights.pages.dev`
* **Framework**: React 19, TanStack Start, Nitro `cloudflare-module` preset.

### Build Configuration:
* **Build Command**: `npm run build`
* **Output Directory**: `.output/public`
* **Redirects File**: `public/_redirects` (`/* /index.html 200` for SPA client routing).

### Environment Variables:
```env
VITE_API_URL=https://grounded-o09a.onrender.com
VITE_SUPABASE_URL=https://cmbmuqhnhgpeqtmkfffp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 4. Mobile Client (Flutter 3.x with PyNgrok Tunneling)

### Architecture:
* **Platform**: Flutter (Android, iOS, Windows desktop).
* **Design System**: Mirrors the dark emerald web interface with collapsible `CitationCard` widgets and radial confidence indicators.
* **Connectivity**: Accepts dynamic backend base URLs at build/run time.

### Launching Local Development with Ngrok Tunnel:
1. Start the backend with Ngrok auto-tunneling:
   ```bash
   python backend/server.py
   ```
   *The console will output the active public tunnel URL (e.g. `https://halogen-cling-entertain.ngrok-free.dev`).*

2. Run the Flutter client pointing to the tunnel or Render:
   ```bash
   cd mobile
   flutter run -d windows --dart-define=API_BASE_URL=https://grounded-o09a.onrender.com
   ```

---

## 5. Live Demo Script: The 3 Core Pitch Scenarios

When presenting to hackathon judges, run these 3 scenarios sequentially to demonstrate all core capabilities:

---

### 🟢 Scenario 1: High-Confidence Evidence Grounding
* **Prompt to Submit**:  
  `"What age group does the USPSTF recommend for behavioral counseling on sun protection, and what is the recommendation grade?"`
* **What to Show the Judges**:
  1. **Speed**: Response returns in **`< 2.5s`**.
  2. **Confidence Gauge**: Displays **`High`** confidence.
  3. **Traceability**: Click on the **Evidence Panel** to show direct citation linking to `uspstf_skin_cancer_2018-CH-007` on **Page 1** of the 2018 guideline.
  4. **Key Talking Point**: *"Notice how every single claim is tethered to a real page and paragraph number. The model cannot hallucinate."*

---

### 🛑 Scenario 2: Instant Pre-Retrieval Safety Refusal
* **Prompt to Submit**:  
  `"I have a dark asymmetrical spot on my shoulder that is bleeding, diagnose me if I have melanoma and tell me what medication dose to take."`
* **What to Show the Judges**:
  1. **Speed**: Intercepted in **`0.00ms`** (Layer 1 Regex Guardrail).
  2. **Safety Status**: Returns **`Safety Refusal`** with `confidence: N/A`.
  3. **Clinical Guidance**: Directly redirects the patient to emergency/in-person clinical care without providing dangerous unverified medical diagnosis.
  4. **Key Talking Point**: *"Our Layer 1 safety classifier halts patient diagnosis and dosage inquiries before touching the vector database or LLM."*

---

### 🔍 Scenario 3: Out-of-Scope Transparent Refusal
* **Prompt to Submit**:  
  `"What is the first-line pharmacologic treatment for managing stage 2 hypertension in adult patients?"`
* **What to Show the Judges**:
  1. **Threshold Gating**: Top similarity score is `< 0.57`.
  2. **Status**: Returns **`Insufficient Evidence`**.
  3. **Integrity**: Transparently admits the indexed corpus only covers USPSTF skin cancer guidelines, refusing to fabricate cardiology advice.
  4. **Key Talking Point**: *"Generic AI guesses an answer; Grounded transparently enforces knowledge boundaries."*

---

## 6. Troubleshooting & Health Checks

### Check Backend Health:
```bash
curl -s https://grounded-o09a.onrender.com/health
```
**Expected Response**:
```json
{
  "status": "ok",
  "index_loaded": true,
  "chunk_count": 338,
  "llm_mode": "live (groq)"
}
```

### Test Query via cURL:
```bash
curl -X POST https://grounded-o09a.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the ABCDE criteria for melanoma?"}'
```
