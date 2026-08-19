import { API_BASE_URL } from "./config";
import type {
  AskResponse,
  Confidence,
  EvidenceItem,
  RetrievedChunk,
  RiskTier,
} from "./grounded.types";

/**
 * Port of the Day 3 notebook pipeline (Config A: chunk_size=500, overlap=75, top_k=5).
 * Grounding rules, schema, citation format and thresholds are preserved as-is.
 *
 * When the FastAPI backend is available, all calls are proxied to it.
 * Falls back to the built-in TypeScript simulation when the backend is unreachable.
 */

const API_BASE = API_BASE_URL.replace(/\/+$/, "");

export const WEAK_THRESHOLD = 0.57;
export const TOP_K = 5;

const DOC = "USPSTF Skin Cancer Prevention: Behavioral Counseling (2018)";

interface Chunk {
  chunk_id: string;
  section: string;
  page: number;
  text: string;
}

const CORPUS: Chunk[] = [
  {
    chunk_id: "c0007",
    section: "Recommendation Summary",
    page: 1,
    text: "The USPSTF recommends counseling young adults, adolescents, children, and parents of young children about minimizing exposure to ultraviolet (UV) radiation for persons aged 6 months to 24 years with fair skin types to reduce their risk of skin cancer. (B recommendation)",
  },
  {
    chunk_id: "c0012",
    section: "Recommendation Summary",
    page: 2,
    text: "The USPSTF concludes that the current evidence is insufficient to assess the balance of benefits and harms of counseling adults older than 24 years with fair skin types about minimizing exposure to UV radiation. (I statement)",
  },
  {
    chunk_id: "c0019",
    section: "Practice Considerations: Behavioral Counseling Interventions",
    page: 4,
    text: "Effective counseling interventions addressed sun-protective behaviors including using sunscreen with sun protection factor of 15 or higher, wearing protective clothing such as wide-brimmed hats and long sleeves, seeking shade, and avoiding indoor tanning and midday sun exposure between 10 AM and 4 PM.",
  },
  {
    chunk_id: "c0024",
    section: "Benefits of Counseling",
    page: 5,
    text: "Trials of counseling interventions in children and young adults reported small but consistent increases in composite sun-protection behaviors and reduced indoor tanning. Evidence for reduction in sunburn incidence was mixed, and no trial was powered to detect a reduction in skin cancer incidence directly.",
  },
  {
    chunk_id: "c0031",
    section: "Harms of Counseling",
    page: 6,
    text: "The USPSTF found adequate evidence to bound the harms of behavioral counseling as no greater than small. Potential harms include reduced physical activity outdoors and lower vitamin D levels, but the available evidence did not demonstrate clinically important harm.",
  },
  {
    chunk_id: "c0038",
    section: "Skin Self-Examination",
    page: 7,
    text: "The USPSTF concludes that the current evidence is insufficient to assess the balance of benefits and harms of counseling adults about skin self-examination to prevent skin cancer. (I statement)",
  },
  {
    chunk_id: "c0045",
    section: "Risk Assessment",
    page: 3,
    text: "Fair skin types (Fitzpatrick types I and II), a history of sunburns, family history of skin cancer, presence of atypical or numerous moles, and use of indoor tanning devices are established risk factors for melanoma and keratinocyte carcinoma.",
  },
  {
    chunk_id: "c0052",
    section: "Sunscreen Evidence",
    page: 5,
    text: "Regular sunscreen use has been associated with a reduced incidence of squamous cell carcinoma and, in one long-term trial, melanoma. Protective clothing and shade seeking are considered complementary measures; sunscreen alone is not a substitute for reducing time in peak-intensity sunlight.",
  },
];

/* ---------------------------- risk classifier ---------------------------- */

const PATIENT_SPECIFIC_PATTERNS = [
  /\bdo i have\b/i,
  /\bam i (at risk|dying|sick)\b/i,
  /\bis (this|my) (mole|spot|lesion|rash)\b/i,
  /\bmy (mole|lesion|biopsy|diagnosis|results?)\b/i,
  /\bdiagnose (me|my)\b/i,
  /\bshould i (get|stop|take)\b/i,
];

const DOSAGE_PATTERNS = [
  /\bhow (much|many) (mg|milligrams|ml|doses?)\b/i,
  /\bdosage\b/i,
  /\bprescri(be|ption)\b/i,
  /\bmg\/kg\b/i,
];

const EMERGENCY_PATTERNS = [
  /\b(chest pain|can'?t breathe|bleeding heavily|suicid|overdose|unconscious|stroke|anaphyla)\b/i,
];

export function classifyRisk(question: string): {
  tier: RiskTier;
  reason: string;
} {
  if (EMERGENCY_PATTERNS.some((p) => p.test(question)))
    return {
      tier: "Refuse/Redirect",
      reason: "Possible emergency or acute-harm query — redirect to urgent care.",
    };
  if (DOSAGE_PATTERNS.some((p) => p.test(question)))
    return {
      tier: "Refuse/Redirect",
      reason: "Dosage or prescribing request — out of scope for this source.",
    };
  if (PATIENT_SPECIFIC_PATTERNS.some((p) => p.test(question)))
    return {
      tier: "Needs Caution",
      reason: "Patient-specific question — answer must stay general and cite the guideline.",
    };
  return { tier: "Allowed", reason: "General guideline question." };
}

/* ------------------------------- retrieval ------------------------------- */

const STOP = new Set([
  "the","a","an","of","and","or","to","for","in","on","is","are","what","does","do",
  "how","about","with","that","this","it","be","by","as","at","from","should","can",
  "i","my","me","you","your","their","there","when","which","who","recommend",
]);

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/** similarity_search_with_relevance_scores equivalent (cosine over term vectors). */
export function retrieveFinal(question: string, k = TOP_K): RetrievedChunk[] {
  const q = tokenize(question);
  const qSet = new Map<string, number>();
  q.forEach((t) => qSet.set(t, (qSet.get(t) ?? 0) + 1));

  const scored = CORPUS.map((c) => {
    const tokens = tokenize(c.text + " " + c.section);
    const counts = new Map<string, number>();
    tokens.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    let dot = 0;
    qSet.forEach((v, t) => {
      const m = counts.get(t);
      if (m) dot += v * (1 + Math.log(m));
      else if ([...counts.keys()].some((ct) => ct.startsWith(t.slice(0, 5))))
        dot += v * 0.35;
    });
    const qNorm = Math.sqrt([...qSet.values()].reduce((a, b) => a + b * b, 0)) || 1;
    const dNorm = Math.sqrt(tokens.length) || 1;
    const score = Math.min(0.99, dot / (qNorm * dNorm * 1.15));
    return {
      document: DOC,
      section: c.section,
      page: c.page,
      chunk_id: c.chunk_id,
      score: Number(score.toFixed(3)),
      text: c.text,
    };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

/* ------------------------------- generation ------------------------------ */

function pickClaims(chunks: RetrievedChunk[]): EvidenceItem[] {
  return chunks.slice(0, 3).map((c) => ({
    claim: firstSentence(c.text),
    citation: {
      document: c.document,
      section: c.section,
      page: c.page,
      chunk_id: c.chunk_id,
    },
    passage: c.text,
  }));
}

function firstSentence(text: string): string {
  const m = text.match(/^[^.]+\./);
  return (m ? m[0] : text).trim();
}

/** _simulate_llm_response() fallback from the notebook. */
function simulateLlmResponse(question: string, chunks: RetrievedChunk[]) {
  const evidence = pickClaims(chunks);
  const top = chunks[0]!;
  const confidence: Confidence =
    top.score >= 0.6 ? "High" : top.score >= 0.45 ? "Medium" : "Low";
  return {
    status: "Answered" as const,
    recommendation: `Based on the retrieved guideline text, the response to "${question.replace(/\s+/g, " ").trim()}" is grounded in ${top.section} (page ${top.page}): ${firstSentence(top.text)}`,
    supporting_evidence: evidence,
    confidence,
    missing_information:
      confidence === "High"
        ? ""
        : "Retrieval confidence is not high; verify against the full guideline text before clinical use.",
    safety_note:
      "This summarizes guideline text only. It does not account for individual patient factors.",
  };
}

/* ------------------------------- validation ------------------------------ */

export function validateResponse(
  evidence: EvidenceItem[],
  chunks: RetrievedChunk[],
) {
  const ids = new Set(chunks.map((c) => c.chunk_id));
  const invented = evidence
    .map((e) => e.citation.chunk_id)
    .filter((id) => !ids.has(id));
  return {
    citations_verified: evidence.length - invented.length,
    invented_citations: invented,
  };
}

/* ----------------------------- backend proxy ----------------------------- */

async function callBackendApi(question: string): Promise<AskResponse | null> {
  const urls = [
    `${API_BASE}/ask`,
    "https://grounded-o09a.onrender.com/ask",
    "http://127.0.0.1:8000/ask",
    "http://localhost:8000/ask",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
        signal: AbortSignal.timeout(35000),
      });
      if (res.ok) {
        return (await res.json()) as AskResponse;
      }
    } catch {
      // try next URL
    }
  }
  return null;
}

/* -------------------------------- pipeline ------------------------------- */

export async function runPipeline(question: string): Promise<AskResponse> {
  // Try the FastAPI backend first
  const backendResult = await callBackendApi(question);
  if (backendResult) return backendResult;

  // Fallback to built-in TypeScript simulation
  console.log("[pipeline] FastAPI backend unreachable, using built-in simulation");

  const mode: "live" | "simulated" = process.env["OPEN_ROUTER_KEY"]
    ? "live"
    : "simulated";
  const { tier, reason } = classifyRisk(question);

  if (tier === "Refuse/Redirect") {
    return {
      status: "Safety Refusal",
      recommendation:
        "This question is outside what this evidence-bound assistant will answer.",
      supporting_evidence: [],
      confidence: "N/A",
      missing_information: reason,
      safety_note:
        "For urgent symptoms seek immediate medical care. For prescribing or diagnostic questions, consult a licensed clinician.",
      risk_tier: tier,
      decision_path: "safety_refusal",
      retrieved_chunks: [],
      weak_threshold: WEAK_THRESHOLD,
      top_score: 0,
      mode,
      validation: { citations_verified: 0, invented_citations: [] },
    };
  }

  const chunks = retrieveFinal(question, TOP_K);
  const top = chunks[0]?.score ?? 0;

  if (top < WEAK_THRESHOLD) {
    return {
      status: "Insufficient Evidence",
      recommendation:
        "The source guideline does not contain material that supports an answer to this question.",
      supporting_evidence: [],
      confidence: "Insufficient Evidence",
      missing_information: `Top retrieval similarity was ${top.toFixed(3)}, below the weak-retrieval threshold of ${WEAK_THRESHOLD}. The indexed source covers skin cancer prevention counseling only.`,
      safety_note:
        "Rephrase within skin cancer prevention counseling, or consult a clinician / the appropriate guideline for this topic.",
      risk_tier: tier,
      decision_path: "weak_retrieval_refused",
      retrieved_chunks: chunks,
      weak_threshold: WEAK_THRESHOLD,
      top_score: top,
      mode,
      validation: { citations_verified: 0, invented_citations: [] },
    };
  }

  const gen = simulateLlmResponse(question, chunks);
  const validation = validateResponse(gen.supporting_evidence, chunks);
  const evidence = gen.supporting_evidence.filter(
    (e) => !validation.invented_citations.includes(e.citation.chunk_id),
  );

  return {
    ...gen,
    supporting_evidence: evidence,
    safety_note:
      tier === "Needs Caution"
        ? "This question appears patient-specific. The answer below is general guideline content and is not a diagnosis or personal medical advice."
        : gen.safety_note,
    risk_tier: tier,
    decision_path: "answered",
    retrieved_chunks: chunks,
    weak_threshold: WEAK_THRESHOLD,
    top_score: top,
    mode,
    validation,
  };
}
