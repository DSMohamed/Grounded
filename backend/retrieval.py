"""
Retrieval using similarity_search_with_relevance_scores.
Config A: top_k=5, weak_threshold=0.5.
"""

from .index import get_vectorstore

TOP_K = 5
WEAK_THRESHOLD = 0.57


def retrieve_final(question: str, k: int = TOP_K) -> list[dict]:
    """
    Retrieve top-k chunks with relevance scores.
    Returns list of dicts with document, section, page, chunk_id, score, text.
    """
    vs = get_vectorstore()
    results = vs.similarity_search_with_relevance_scores(question, k=k)

    chunks = []
    for doc, score in results:
        m = doc.metadata
        chunks.append({
            "document": m.get("document_name", "Unknown"),
            "section": m.get("section", "Unknown"),
            "page": m.get("page", m.get("page_number", 0)),
            "chunk_id": m.get("chunk_id", "unknown"),
            "score": round(float(score), 4),
            "text": doc.page_content,
        })

    # Sort by score descending (should already be, but ensure)
    chunks.sort(key=lambda c: c["score"], reverse=True)
    return chunks
