import os, time, requests
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

models = [
    "nvidia/nemotron-3.5-lightning:free",
    "google/gemma-4-26b-a4b-it:free",
    "liquid/lfm-2.5-2.6b:free",
]

for m in models:
    t0 = time.time()
    try:
        r = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": m,
                "messages": [{"role": "user", "content": "Return JSON: {\"test\": 1}"}],
            },
            timeout=8,
        )
        elapsed = round(time.time() - t0, 2)
        print(f"Model {m:<36} -> {r.status_code} in {elapsed}s | text: {r.text[:80]}")
    except Exception as e:
        print(f"Model {m:<36} -> Timeout / Error: {e}")
