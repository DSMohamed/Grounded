import os, time, requests, json, sys, io
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

# Fetch all available free models from OpenRouter API
r = requests.get("https://openrouter.ai/api/v1/models")
if r.status_code == 200:
    all_models = r.json().get("data", [])
    free_models = [m["id"] for m in all_models if ":free" in m["id"]]
    print(f"Total free models available on OpenRouter: {len(free_models)}")
    print("Free models list:", free_models)
else:
    print("Failed to fetch models:", r.status_code)
