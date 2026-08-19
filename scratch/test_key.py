import os
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

models_to_test = [
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "z-ai/glm-5.2:free",
    "liquid/lfm-2.5-2.6b:free",
]

for model in models_to_test:
    r = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json={
            "model": model,
            "messages": [{"role": "user", "content": "Respond with 1 word: OK"}],
        },
        timeout=10,
    )
    print(f"{model:<38} -> Status: {r.status_code} | Msg: {r.text[:120]}")
