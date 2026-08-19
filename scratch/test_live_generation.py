import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from pathlib import Path

env_file = Path(".env")
if env_file.exists():
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            os.environ[k.strip()] = v.strip().strip('"').strip("'")

sys.path.insert(0, ".")
from backend.generation import generate_grounded_answer
from backend.retrieval import retrieve_final

q = "What does the USPSTF conclude about visual skin examination for skin cancer screening in asymptomatic adults?"
chunks = retrieve_final(q)
res, mode = generate_grounded_answer(q, chunks)
print("=" * 60)
print("Generated Mode:", mode)
print("Status:", res.get("status"))
print("Recommendation:", res.get("recommendation"))
print("Citations Count:", len(res.get("supporting_evidence", [])))
for e in res.get("supporting_evidence", []):
    cit = e.get("citation", {})
    print("  - Citation Doc:", cit.get("document"), "| Section:", cit.get("section"), "| Chunk:", cit.get("chunk_id"))
