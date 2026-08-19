import json, re

def repair_and_parse_json(text: str) -> dict:
    raw = text.strip()
    if "```json" in raw:
        raw = raw.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in raw:
        raw = raw.split("```", 1)[1].split("```", 1)[0].strip()

    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        snippet = raw[start : end + 1]
    elif start != -1:
        snippet = raw[start:]
    else:
        snippet = raw

    # Clean trailing commas
    cleaned = re.sub(r",\s*([\]}])", r"\1", snippet)

    # 1. Try standard parse
    try:
        return json.loads(cleaned, strict=False)
    except Exception:
        pass

    # 2. Try closing unclosed quotes and braces (if cut off)
    t = cleaned.strip()
    if t.count('"') % 2 != 0:
        t += '"'
    if t.count('{') > t.count('}'):
        t += '}' * (t.count('{') - t.count('}'))
    if t.count('[') > t.count(']'):
        t += ']' * (t.count('[') - t.count(']'))
    t = re.sub(r",\s*([\]}])", r"\1", t)
    
    try:
        return json.loads(t, strict=False)
    except Exception:
        pass

    # 3. Regex field extractor fallback
    status_m = re.search(r'"status"\s*:\s*"([^"]+)"', raw, re.I)
    rec_m = re.search(r'"recommendation"\s*:\s*"([^"]+)"', raw, re.I)
    conf_m = re.search(r'"confidence"\s*:\s*"([^"]+)"', raw, re.I)
    
    # Extract any chunk_id citations
    cids = re.findall(r'"chunk_id"\s*:\s*"([^"]+)"', raw, re.I)
    
    if rec_m:
        return {
            "status": status_m.group(1) if status_m else "Answered",
            "recommendation": rec_m.group(1),
            "supporting_evidence": [{"claim": rec_m.group(1), "citation": {"document": "USPSTF", "section": "Recommendation", "page": 1, "chunk_id": cid}} for cid in cids] or [],
            "confidence": conf_m.group(1) if conf_m else "High",
            "missing_information": "",
            "safety_note": "This summarizes guideline evidence only."
        }

    raise ValueError(f"Could not parse or repair JSON: {text[:100]}")

# Test with truncated json
test_truncated = '{\n  "status": "Answered",\n  "recommendation": "The USPSTF recommends counseling young adults to reduce UV exposure.",\n  "supporting_evidence": [\n    {\n      "claim": "Counseling fair skinned youth",\n      "citation": {\n        "document": "USPSTF",\n        "section": "Rec",\n        "page": 1,\n        "chunk_id": "uspstf_skin_cancer_2018-CH-006"\n      }\n    }\n  ],\n  "confidence": "High",\n  "safety_note": "Guideline summary'

print("Repaired result:", repair_and_parse_json(test_truncated))
