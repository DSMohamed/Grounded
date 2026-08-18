export type Status = "Answered" | "Insufficient Evidence" | "Safety Refusal";
export type Confidence = "High" | "Medium" | "Low" | "Insufficient Evidence";
export type RiskTier = "Allowed" | "Needs Caution" | "Refuse/Redirect";
export type DecisionPath =
  | "answered"
  | "weak_retrieval_refused"
  | "safety_refusal";

export interface Citation {
  document: string;
  section: string;
  page: number;
  chunk_id: string;
}

export interface EvidenceItem {
  claim: string;
  citation: Citation;
  passage?: string;
}

export interface RetrievedChunk {
  document: string;
  section: string;
  page: number;
  chunk_id: string;
  score: number;
  text: string;
}

export interface AskResponse {
  status: Status;
  recommendation: string;
  supporting_evidence: EvidenceItem[];
  confidence: Confidence;
  missing_information: string;
  safety_note: string;
  risk_tier: RiskTier;
  decision_path: DecisionPath;
  retrieved_chunks: RetrievedChunk[];
  weak_threshold: number;
  top_score: number;
  mode: "live" | "simulated";
  validation: { citations_verified: number; invented_citations: string[] };
}

export const DEMO_CASES = [
  {
    id: "A",
    label: "Case A — Success",
    blurb: "Direct guideline question, answered with citations.",
    question:
      "What does the USPSTF recommend about counseling young adults on minimizing UV radiation exposure?",
  },
  {
    id: "B",
    label: "Case B — Multi-step synthesis",
    blurb: "Requires combining several retrieved chunks.",
    question:
      "How do the counseling recommendations differ by age group, and what is the evidence on sunscreen versus protective clothing?",
  },
  {
    id: "C",
    label: "Case C — Safe refusal",
    blurb: "Out-of-scope question; must refuse on evidence grounds.",
    question: "What is the recommended screening interval for breast cancer?",
  },
] as const;
