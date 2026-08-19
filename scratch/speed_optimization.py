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
    "X-Title": "Grounded",
    "Content-Type": "application/json",
}

sys.path.insert(0, ".")
from backend.retrieval import retrieve_final

t_start = time.time()
chunks = retrieve_final("What does the USPSTF recommend about counseling young adults on UV exposure?")[:3]
t_retrieval = time.time() - t_start

context = "\n".join([f"[{c['chunk_id']} | {c['section']}] {c['text']}" for c in chunks])

sys_prompt = "You are a clinical AI. Answer in JSON with keys: status, recommendation, supporting_evidence (list of claim and citation {document, section, page, chunk_id}), confidence, missing_information, safety_note."
user_prompt = f"Evidence:\n{context}\n\nQuestion: What does the USPSTF recommend about counseling young adults on UV exposure?"

print(f"Retrieval took: {t_retrieval*1000:.1f} ms")
print("Testing direct ultra-fast model calls on OpenRouter:")

models_to_test = [
    "liquid/lfm-2.5-2.6b:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "poolside/laguna-s-2.1:free",
    "google/gemma-4-26b-a4b-it:free",
]

for m in models_to_test:
    t0 = time.time()
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": m,
                "messages": [
                    {"role": "system", "content": sys_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "max_tokens": 300,
                "temperature": 0,
            },
            timeout=8,
        )
        elapsed = time.time() - t0
        print(f"Model: {m:<32} | Status: {r.status_code} | Time: {elapsed:.2f}s")
        if r.status_code == 200:
            print("  Preview:", r.json()['choices'][0]['message']['content'][:120])
    except Exception as e:
        elapsed = time.time() - t0
        print(f"Model: {m:<32} | Failed after {elapsed:.2f}s: {e}")
