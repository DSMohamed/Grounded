"""
Multi-Document PDF loading, cleaning, and chunking.
Config A: chunk_size=500, overlap=75.
Ingests both USPSTF Skin Cancer Counseling and USPSTF Skin Cancer Screening guidelines.
"""

import os
import re
from pathlib import Path

from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

CHUNK_SIZE = 500
CHUNK_OVERLAP = 75

BASE_DIR = Path(__file__).resolve().parent.parent

DOCUMENTS = [
    {
        "id": "uspstf_skin_cancer_2018",
        "name": "USPSTF Behavioral Counseling to Prevent Skin Cancer (2018)",
        "file": BASE_DIR / "skin-cancer-counseling-final-recommendation.pdf",
        "ref_start_page": 7,
        "source_url": "https://www.uspreventiveservicestaskforce.org",
        "section_map": {
            1: "Abstract & Recommendation Summary",
            2: "Summary of Recommendations and Evidence",
            3: "Rationale - Benefits, Harms, and Clinical Considerations",
            4: "Clinical Considerations - Risk Assessment and Counseling",
            5: "Implementation and Research Needs",
            6: "Discussion - Evidence on Behavior Change and Cancer Risk",
            7: "Discussion - Net Benefit and Recommendation Update",
        },
    },
    {
        "id": "uspstf_skin_cancer_screening_2023",
        "name": "USPSTF Screening for Skin Cancer in Adolescents and Adults (2023)",
        "file": BASE_DIR / "skin-cancer-screening-final-recommendation.pdf",
        "ref_start_page": 10,
        "source_url": "https://www.uspreventiveservicestaskforce.org",
        "section_map": {
            1: "Abstract & Screening Recommendation Summary",
            2: "Summary of Recommendations and Evidence (I Statement)",
            3: "Rationale - Benefits and Harms of Screening",
            4: "Clinical Considerations - Risk Assessment & High-Risk Groups",
            5: "Implementation, Patient Counseling & Research Needs",
        },
    },
]


def clean_text(text: str) -> str:
    """Clean extracted PDF text."""
    if not text:
        return ""
    text = re.sub(r"-\s*\n\s*", "", text)
    text = re.sub(r"[\n\r\t]+", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"[^\x20-\x7E]", " ", text)
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def load_and_chunk_single_doc(doc_spec: dict) -> list[Document]:
    path = doc_spec["file"]
    if not path.exists():
        print(f"Warning: Document PDF not found at {path}, skipping.")
        return []

    loader = PyPDFLoader(str(path))
    raw_pages = loader.load()

    cleaned_pages = []
    for p in raw_pages:
        txt = clean_text(p.page_content)
        if txt:
            cleaned_pages.append(Document(page_content=txt, metadata=p.metadata))

    # Strip reference pages if applicable
    ref_page = doc_spec.get("ref_start_page", 99)
    clinical_pages = [d for d in cleaned_pages if d.metadata.get("page", 0) < ref_page]

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", "; ", " ", ""],
    )
    chunks = splitter.split_documents(clinical_pages)

    doc_id = doc_spec["id"]
    doc_name = doc_spec["name"]
    section_map = doc_spec.get("section_map", {})

    for i, chunk in enumerate(chunks):
        page = chunk.metadata.get("page", None)
        page_num = (page + 1) if page is not None else 1
        chunk_id_str = f"{doc_id}-CH-{i+1:03d}"

        chunk.metadata["document_id"] = doc_id
        chunk.metadata["document_name"] = doc_name
        chunk.metadata["page"] = page_num
        chunk.metadata["page_number"] = page_num
        chunk.metadata["section"] = section_map.get(page_num, "Clinical Considerations")
        chunk.metadata["chunk_id"] = chunk_id_str
        chunk.metadata["source_url"] = doc_spec.get("source_url", "")
        chunk.metadata.pop("source", None)

    return chunks


def load_and_chunk(pdf_path: Path | None = None) -> list[Document]:
    """
    Ingest all guideline documents in the multi-document corpus.
    """
    if pdf_path is not None:
        # Fallback for single custom path
        spec = {
            "id": "custom_doc",
            "name": pdf_path.stem,
            "file": pdf_path,
            "ref_start_page": 99,
            "section_map": {},
        }
        return load_and_chunk_single_doc(spec)

    all_chunks = []
    for spec in DOCUMENTS:
        doc_chunks = load_and_chunk_single_doc(spec)
        print(f"[ingest] Ingested '{spec['name']}': {len(doc_chunks)} chunks")
        all_chunks.extend(doc_chunks)

    print(f"[ingest] Total multi-document corpus: {len(all_chunks)} chunks across {len(DOCUMENTS)} guidelines")
    return all_chunks
