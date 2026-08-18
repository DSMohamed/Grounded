"""
Input risk classification.
Regex-based with three tiers: Allowed / Needs Caution / Refuse-Redirect.
Ported directly from the Day 3 notebook.
"""

import re

PATIENT_SPECIFIC_PATTERNS = [
    re.compile(r"\bdo i have\b", re.IGNORECASE),
    re.compile(r"\bam i\b.*\b(risk|cancer|melanoma|dying|sick)\b", re.IGNORECASE),
    re.compile(r"\bdiagnose me\b", re.IGNORECASE),
    re.compile(r"\bdo i need\b", re.IGNORECASE),
    re.compile(r"\bis (this|my) (mole|spot|lesion|rash)\b", re.IGNORECASE),
    re.compile(r"\bmy (mole|lesion|biopsy|diagnosis|results?)\b", re.IGNORECASE),
    re.compile(r"\bshould i (get|stop|take)\b", re.IGNORECASE),
]

DOSAGE_PATTERNS = [
    re.compile(r"\bwhat dose\b", re.IGNORECASE),
    re.compile(r"\bhow (much|many) (should|do) i (take|use)\b", re.IGNORECASE),
    re.compile(r"\bmy dose\b", re.IGNORECASE),
    re.compile(r"\bprescri(be|ption)\b", re.IGNORECASE),
    re.compile(r"\bhow (much|many) (mg|milligrams|ml|doses?)\b", re.IGNORECASE),
    re.compile(r"\bdosage\b", re.IGNORECASE),
    re.compile(r"\bmg/kg\b", re.IGNORECASE),
]

TREATMENT_CHOICE_PATTERNS = [
    re.compile(r"\bwhich treatment should i\b", re.IGNORECASE),
    re.compile(r"\bwhat treatment should i\b", re.IGNORECASE),
    re.compile(r"\bshould i (get|choose|start)\b.*\b(treatment|surgery|therapy)\b", re.IGNORECASE),
]

EMERGENCY_PATTERNS = [
    re.compile(
        r"\b(chest pain|can'?t breathe|bleeding heavily|suicid|overdose|unconscious|stroke|anaphyla)\b",
        re.IGNORECASE,
    ),
]

SAFETY_REFUSAL_MESSAGE = (
    "I cannot provide a patient-specific diagnosis, prescription, dosage, or treatment "
    "selection. Please consult a qualified clinician."
)


def classify_risk(question: str) -> dict:
    """
    Classify the input query into a risk tier.
    Returns {"tier": str, "reason": str}.
    """
    # Emergency takes priority
    if any(p.search(question) for p in EMERGENCY_PATTERNS):
        return {
            "tier": "Refuse/Redirect",
            "reason": "Possible emergency or acute-harm query — redirect to urgent care.",
        }

    # Dosage / prescribing
    if any(p.search(question) for p in DOSAGE_PATTERNS):
        return {
            "tier": "Refuse/Redirect",
            "reason": "Dosage or prescribing request — out of scope for this source.",
        }

    # Treatment choice
    if any(p.search(question) for p in TREATMENT_CHOICE_PATTERNS):
        return {
            "tier": "Refuse/Redirect",
            "reason": "Personalized treatment selection request — requires clinical assessment.",
        }

    # Patient-specific
    if any(p.search(question) for p in PATIENT_SPECIFIC_PATTERNS):
        return {
            "tier": "Needs Caution",
            "reason": "Patient-specific question — answer must stay general and cite the guideline.",
        }

    return {"tier": "Allowed", "reason": "General guideline question."}
