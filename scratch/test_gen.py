import os
import sys
import traceback
from pathlib import Path

sys.path.insert(0, ".")

env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")

from backend.retrieval import retrieve_final
from backend.generation import generate_grounded_answer

chunks = retrieve_final("What does the USPSTF recommend about counseling young adults on UV exposure?")
print(f"Retrieved {len(chunks)} chunks, top score = {chunks[0]['score']}")

try:
    resp, mode = generate_grounded_answer("What does the USPSTF recommend about counseling young adults on UV exposure?", chunks)
    print(f"Result mode: {mode}")
    print(f"Status: {resp.get('status')}")
    print(f"Recommendation: {resp.get('recommendation')}")
    print(f"Evidence items: {len(resp.get('supporting_evidence', []))}")
except Exception as e:
    print("Error:", e)
    traceback.print_exc()
