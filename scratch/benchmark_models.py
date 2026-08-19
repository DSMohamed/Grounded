import os
import time
import requests
from pathlib import Path

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

prompt = """You are a clinical decision-support assistant.
Using ONLY this evidence:
[Doc: USPSTF | Sec: Rec | Page: 1 | Chunk: c01] The USPSTF recommends counseling young adults aged 6 months to 24 years with fair skin to minimize UV exposure.

Question: What is recommended for young adults?
Respond strictly in JSON format with status, recommendation, supporting_evidence, confidence, missing_information, safety_note."""

models = [
    "nvidia/nemotron-3.5-lightning:free",
    "google/gemma-4-26b-a4b-it:free",
    "liquid/lfm-2.5-2.6b:free",
    "poolside/laguna-s-2.1:free",
]

print("=" * 60)
print("BENCHMARKING OPENROUTER FREE MODELS FOR LATENCY & ACCURACY")
print("=" * 60)

import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

for m in models:
    t0 = time.time()
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": m,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 512,
                "temperature": 0,
            },
            timeout=25,
        )
        elapsed = time.time() - t0
        if r.status_code == 200:
            content = r.json()["choices"][0]["message"]["content"]
            print(f"\n[PASS] {m}")
            print(f"   Latency: {elapsed:.2f} seconds")
            print(f"   Output: {content[:150]}...")
        else:
            print(f"\n[FAIL] {m} -> Status: {r.status_code} ({r.text[:80]})")
    except Exception as e:
        print(f"\n[ERROR] {m} -> Error / Timeout: {e}")
