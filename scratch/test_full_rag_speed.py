import os, time, sys, io
import requests
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
from backend.generation import build_context, DAY3_SYSTEM_PROMPT

chunks = retrieve_final("What does the USPSTF recommend about counseling young adults on UV exposure?")
context = build_context(chunks)

prompt = (
    f"{DAY3_SYSTEM_PROMPT}\n\n"
    f"Retrieved evidence:\n{context}\n\n"
    f"Question: What does the USPSTF recommend about counseling young adults on UV exposure?\n\n"
    "Respond with the JSON object only."
)

models = [
    "poolside/laguna-s-2.1:free",
    "nvidia/nemotron-3.5-lightning:free",
    "google/gemma-4-26b-a4b-it:free",
]

for m in models:
    t0 = time.time()
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": m,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 500,
                "temperature": 0,
            },
            timeout=20,
        )
        elapsed = round(time.time() - t0, 2)
        if r.status_code == 200:
            print(f"[PASS] {m:<35} | {elapsed}s | {r.json()['choices'][0]['message']['content'][:120]}...")
        else:
            print(f"[FAIL] {m:<35} | {elapsed}s | status {r.status_code}")
    except Exception as e:
        elapsed = round(time.time() - t0, 2)
        print(f"[TIMEOUT] {m:<32} | {elapsed}s | error: {e}")
