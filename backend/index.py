"""
Embedding + Chroma vectorstore build/load.
Persists to disk so the API doesn't re-embed on every restart.
Uses BAAI/bge-small-en-v1.5 via fastembed (matching the notebook).
"""

import os
from pathlib import Path

from langchain_community.embeddings.fastembed import FastEmbedEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from .ingest import load_and_chunk

PERSIST_DIR = Path(__file__).resolve().parent.parent / "chroma_index"
COLLECTION_NAME = "uspstf_skin_cancer"

_vectorstore: Chroma | None = None


def _get_embeddings() -> FastEmbedEmbeddings:
    return FastEmbedEmbeddings(model_name="BAAI/bge-small-en-v1.5")


def build_index(force_rebuild: bool = False) -> Chroma:
    """Build or load the persisted Chroma index."""
    global _vectorstore

    embeddings = _get_embeddings()

    if PERSIST_DIR.exists() and not force_rebuild:
        print(f"[index] Loading persisted index from {PERSIST_DIR}")
        _vectorstore = Chroma(
            persist_directory=str(PERSIST_DIR),
            embedding_function=embeddings,
            collection_name=COLLECTION_NAME,
        )
        count = _vectorstore._collection.count()
        if count > 0:
            print(f"[index] Loaded {count} chunks from existing index")
            return _vectorstore
        print("[index] Index exists but is empty — rebuilding")

    print("[index] Building index from PDF...")
    chunks = load_and_chunk()
    documents = [
        Document(page_content=c["text"], metadata=c["metadata"])
        for c in chunks
    ]

    _vectorstore = Chroma.from_documents(
        documents=documents,
        embedding=embeddings,
        persist_directory=str(PERSIST_DIR),
        collection_name=COLLECTION_NAME,
    )
    print(f"[index] Built index with {len(documents)} chunks, persisted to {PERSIST_DIR}")
    return _vectorstore


def get_vectorstore() -> Chroma:
    """Get the loaded vectorstore (must call build_index first)."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = build_index()
    return _vectorstore
