import os, time, sys, io, requests
from pathlib import Path

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")

key = os.environ.get("OPEN_ROUTER_KEY", "")

headers = {
    "Authorization": f"Bearer {key}",
    "HTTP-Referer": "http://localhost:8080",
    "X-Title": "Grounded Clinical Assistant",
    "Content-Type": "application/json",
}

sys.path.insert(0, ".")
from backend.retrieval import retrieve_final

# Pick top 3 most relevant chunks instead of 5 to cut tokens by 50%
chunks = retrieve_final("What does the USPSTF recommend about counseling young adults on UV exposure?")[:3]

context_parts = []
for c in chunks:
    context_parts.append(
        f"[Chunk: {c['chunk_id']} | Doc: {c.get('document_name','USPSTF')} | Sec: {c.get('section','')} | Page: {c.get('page',1)}]\n{c['text']}"
    )
context = "\n\n".join(context_parts)

system_prompt = """You are an evidence-bound clinical decision assistant.
Answer the question using ONLY the provided evidence.
Rules:
1. Base EVERY claim on the evidence.
2. For each claim, cite the chunk_id.
3. Output ONLY this JSON format:
{
  "status": "answered" | "insufficient_evidence",
  "recommendation": "string",
  "supporting_evidence": [{"claim": "string", "citation": {"document": "string", "section": "string", "page": 1, "chunk_id": "string"}}],
  "confidence": "High" | "Medium" | "Low",
  "missing_information": "",
  "safety_note": "string"
}"""

user_prompt = f"Evidence:\n{context}\n\nQuestion: What does the USPSTF recommend about counseling young adults on UV exposure?"

test_models = [
    "poolside/laguna-xs-2.1:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "openai/gpt-oss-20b:free",
    "poolside/laguna-s-2.1:free",
    "google/gemma-4-26b-a4b-it:free",
]

for m in test_models:
    t0 = time.time()
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": m,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "max_tokens": 400,
                "temperature": 0,
            },
            timeout=15,
        )
        elapsed = round(time.time() - t0, 2)
        if r.status_code == 200:
            txt = r.json()['choices'][0]['message']['content']
            print(f"[PASS] {m:<32} | {elapsed:>5}s | Output preview: {txt[:90]}...")
        else:
            print(f"[FAIL] {m:<32} | {elapsed:>5}s | status {r.status_code} - {r.text[:60]}")
    except Exception as e:
        elapsed = round(time.time() - t0, 2)
        print(f"[TIMEOUT] {m:<29} | {elapsed:>5}s | error: {e}")
