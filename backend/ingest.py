"""
PDF loading, cleaning, and chunking.
Config A: chunk_size=500, overlap=75 (selected after Day 2 evaluation).
"""

import re
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 500
CHUNK_OVERLAP = 75
PDF_PATH = Path(__file__).resolve().parent.parent / "skin-cancer-counseling-final-recommendation.pdf"


def _clean_text(text: str) -> str:
    """Remove artefacts common in USPSTF PDF exports."""
    # collapse excessive whitespace
    text = re.sub(r"[ \t]+", " ", text)
    # normalise line breaks
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _detect_section(text: str, page_num: int) -> str:
    """
    Best-effort section detection from chunk content.
    Matches known USPSTF recommendation-statement headings.
    """
    section_patterns = [
        (r"(?i)recommendation\s*summary", "Recommendation Summary"),
        (r"(?i)importance", "Importance"),
        (r"(?i)net benefit", "Net Benefit"),
        (r"(?i)practice\s*considerations", "Practice Considerations"),
        (r"(?i)risk\s*assessment", "Risk Assessment"),
        (r"(?i)benefit.+counseling", "Benefits of Counseling"),
        (r"(?i)harm.+counseling", "Harms of Counseling"),
        (r"(?i)sunscreen\s*evidence", "Sunscreen Evidence"),
        (r"(?i)skin\s*self.?exam", "Skin Self-Examination"),
        (r"(?i)other\s*considerations", "Other Considerations"),
        (r"(?i)discussion", "Discussion"),
        (r"(?i)clinical\s*considerations", "Clinical Considerations"),
        (r"(?i)rationale", "Rationale"),
        (r"(?i)evidence\s*summary", "Evidence Summary"),
        (r"(?i)behavioral\s*counseling", "Behavioral Counseling Interventions"),
    ]
    for pattern, label in section_patterns:
        if re.search(pattern, text):
            return label
    return f"Page {page_num}"


def load_and_chunk(pdf_path: Path | None = None) -> list[dict]:
    """
    Load the PDF, clean it, and split into chunks with metadata.
    Returns a list of dicts: {text, metadata: {document_name, section, page, chunk_id}}.
    """
    path = pdf_path or PDF_PATH
    if not path.exists():
        raise FileNotFoundError(f"PDF not found at {path}")

    loader = PyPDFLoader(str(path))
    raw_pages = loader.load()

    # Clean page content
    for page in raw_pages:
        page.page_content = _clean_text(page.page_content)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    chunks = splitter.split_documents(raw_pages)

    doc_name = "USPSTF Skin Cancer Prevention: Behavioral Counseling (2018)"
    results = []
    for i, chunk in enumerate(chunks):
        page_num = chunk.metadata.get("page", 0) + 1  # PyPDFLoader is 0-indexed
        section = _detect_section(chunk.page_content, page_num)
        results.append({
            "text": chunk.page_content,
            "metadata": {
                "document_name": doc_name,
                "section": section,
                "page": page_num,
                "chunk_id": f"c{i:04d}",
            },
        })

    return results
