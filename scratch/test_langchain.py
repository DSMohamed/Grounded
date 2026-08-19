import os
from pathlib import Path
from langchain_openai import ChatOpenAI

env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")

key = os.environ.get("OPEN_ROUTER_KEY", "")

models_to_test = [
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
]

for model_name in models_to_test:
    print(f"\n--- Testing LangChain ChatOpenAI with {model_name} ---")
    try:
        llm = ChatOpenAI(
            model=model_name,
            base_url="https://openrouter.ai/api/v1",
            api_key=key,
            temperature=0,
            max_tokens=1024,
            request_timeout=25,
            default_headers={
                "HTTP-Referer": "http://localhost:8080",
                "X-Title": "Grounded Clinical Assistant",
            },
        )
        res = llm.invoke('Return JSON: {"status": "Answered", "message": "hello"}')
        print("Success! Output:", res.content)
    except Exception as e:
        print("Failed:", e)
