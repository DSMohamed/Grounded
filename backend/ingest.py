"""
PDF loading, cleaning, and chunking.
Config A: chunk_size=500, overlap=75 (selected after Day 2 evaluation).
Ported exactly from T1_Day3_OpenRouter_Free notebook.
"""

import os
import re
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

DOC_ID = "uspstf_skin_cancer_2018"
DOC_NAME = "Behavioral Counseling to Prevent Skin Cancer - Recommendation Statement"
SOURCE_URL = "https://www.uspreventiveservicestaskforce.org"

CHUNK_SIZE = 500
CHUNK_OVERLAP = 75
REF_START_PAGE = 7  # 0-indexed: removes pages >= 7 (references section)

PAGE_SECTION_MAP = {
    1: "Abstract & Recommendation Summary",
    2: "Summary of Recommendations and Evidence",
    3: "Rationale - Benefits, Harms, and Clinical Considerations",
    4: "Clinical Considerations - Risk Assessment and Counseling",
    5: "Implementation and Research Needs",
    6: "Discussion - Evidence on Behavior Change and Cancer Risk",
    7: "Discussion - Net Benefit and Recommendation Update",
}

PDF_PATH = Path(__file__).resolve().parent.parent / "skin-cancer-counseling-final-recommendation.pdf"


def clean_text(text: str) -> str:
    """Clean text exactly as in notebook Cell 1."""
    if not text:
        return ""
    text = re.sub(r"-\s*\n\s*", "", text)
    text = re.sub(r"[\n\r\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"[^\x20-\x7E]", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def load_and_chunk(pdf_path: Path | None = None) -> list[Document]:
    """
    Load the PDF, clean it, filter reference pages, and chunk using Config A (500/75).
    """
    path = pdf_path or PDF_PATH
    if not path.exists():
        raise FileNotFoundError(f"PDF not found at {path}")

    loader = PyPDFLoader(str(path))
    raw_pages = loader.load()

    cleaned_pages = []
    for p in raw_pages:
        txt = clean_text(p.page_content)
        if txt:
            cleaned_pages.append(Document(page_content=txt, metadata=p.metadata))

    # Strip reference pages (page 7+ in 0-indexed PyPDF)
    clinical_pages = [d for d in cleaned_pages if d.metadata.get("page", 0) < REF_START_PAGE]

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "; ", " ", ""],
    )
    chunks = splitter.split_documents(clinical_pages)

    for i, chunk in enumerate(chunks):
        page = chunk.metadata.get("page", None)
        page_num = (page + 1) if page is not None else 1
        chunk_id_str = f"{DOC_ID}-CH-{i+1:03d}"

        chunk.metadata["document_id"] = DOC_ID
        chunk.metadata["document_name"] = DOC_NAME
        chunk.metadata["page"] = page_num
        chunk.metadata["page_number"] = page_num
        chunk.metadata["section"] = PAGE_SECTION_MAP.get(page_num, "Unclassified")
        chunk.metadata["chunk_id"] = chunk_id_str
        chunk.metadata["source_url"] = SOURCE_URL
        chunk.metadata.pop("source", None)

    return chunks
