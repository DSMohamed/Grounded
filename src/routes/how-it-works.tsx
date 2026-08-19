import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  FileText,
  Scissors,
  Database,
  Search,
  Shield,
  Gauge,
  Brain,
  BadgeCheck,
  ArrowRight,
  Zap,
  Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — Grounded Clinical Evidence Assistant" },
      {
        name: "description",
        content:
          "Interactive architecture diagram showing how the evidence-bound RAG pipeline processes queries with retrieval, risk classification, and citation validation.",
      },
      { property: "og:title", content: "How It Works — Grounded" },
    ],
  }),
  component: HowItWorksPage,
});

/* ── Architecture nodes ─────────────────────────────────────────────────── */

interface ArchNode {
  id: string;
  label: string;
  icon: typeof FileText;
  detail: string;
  config?: string;
  color: string;
}

const INGEST_NODES: ArchNode[] = [
  {
    id: "pdf",
    label: "PDF Source",
    icon: FileText,
    detail:
      "The USPSTF Behavioral Counseling for Skin Cancer Prevention guideline is loaded as the primary knowledge source. Reference pages are stripped at page 7+.",
    config: "Document: USPSTF Skin Cancer Prevention",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "chunk",
    label: "Text Chunking",
    icon: Scissors,
    detail:
      "The document is split into overlapping chunks using a recursive character splitter. Each chunk is tagged with its source section and page number via PAGE_SECTION_MAP.",
    config: "chunk_size=500 · overlap=75 · Config A",
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "embed",
    label: "Embedding Index",
    icon: Database,
    detail:
      "Chunks are embedded using BAAI/bge-small-en-v1.5 via FastEmbed and stored in ChromaDB with cosine similarity space.",
    config: "model=bge-small-en-v1.5 · cosine · ChromaDB",
    color: "text-indigo-600 dark:text-indigo-400",
  },
];

const QUERY_NODES: ArchNode[] = [
  {
    id: "risk",
    label: "Risk Classifier",
    icon: Shield,
    detail:
      "A 3-tier regex-based classifier gates the query before retrieval. Personal medical requests (dosage, diagnosis) are refused pre-retrieval. Safety-sensitive topics get cautionary framing.",
    config: "Tiers: Allowed → Needs Caution → Refuse/Redirect",
    color: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "retrieve",
    label: "Vector Retrieval",
    icon: Search,
    detail:
      "The query is embedded and the top-k most similar chunks are retrieved from ChromaDB, ranked by cosine similarity score.",
    config: "top_k=5 · cosine similarity",
    color: "text-cyan-600 dark:text-cyan-400",
  },
  {
    id: "threshold",
    label: "Threshold Gate",
    icon: Gauge,
    detail:
      'If the top retrieval score falls below the weak_threshold, the system returns "Insufficient Evidence" rather than attempting generation. This is the key anti-hallucination mechanism.',
    config: "weak_threshold=0.5",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "generate",
    label: "LLM Generation",
    icon: Brain,
    detail:
      "The retrieved chunks are formatted into an evidence context block and passed to the LLM with the DAY3_SYSTEM_PROMPT. The model is instructed to cite only provided evidence and return structured JSON.",
    config: "model=gpt-oss-20b:free · max_tokens=2048 · temp=0",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "validate",
    label: "Citation Validator",
    icon: BadgeCheck,
    detail:
      "Every citation in the LLM response is cross-checked against actual retrieved chunk IDs. Invented citations are flagged and stripped. The schema is validated for structural correctness.",
    config: "Schema check + invented citation detection",
    color: "text-evidence",
  },
];

/* ── Health status fetching ─────────────────────────────────────────────── */

interface HealthData {
  status: string;
  index_loaded: boolean;
  chunk_count: number;
  llm_mode: string;
}

/* ── Main page ──────────────────────────────────────────────────────────── */

function HowItWorksPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.json())
      .then((d) => setHealth(d as HealthData))
      .catch(() => { });
  }, []);

  const allNodes = [...INGEST_NODES, ...QUERY_NODES];
  const selectedNode = allNodes.find((n) => n.id === selected);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <header className="max-w-3xl">
        <p className="label-mono text-evidence">Architecture</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
          How the pipeline works
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Click any node below to see its configuration and purpose. Every query
          passes through a 5-stage pipeline designed to prevent hallucination
          and enforce evidence boundaries.
        </p>
      </header>

      {/* Live status bar */}
      {health && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-evidence/30 bg-evidence-soft px-4 py-2 font-mono text-xs text-evidence">
            <Server className="size-3.5" />
            Backend: {health.status}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs text-muted-foreground">
            <Database className="size-3.5" />
            {health.chunk_count} chunks indexed
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 font-mono text-xs text-muted-foreground">
            <Zap className="size-3.5" />
            LLM: {health.llm_mode === "live" ? "OpenRouter (Live)" : "Simulation"}
          </span>
        </div>
      )}

      {/* Ingestion pipeline */}
      <section>
        <h2 className="label-mono mb-6 text-muted-foreground">
          Phase 1 — Document Ingestion (One-time)
        </h2>
        <PipelineRow
          nodes={INGEST_NODES}
          selected={selected}
          onSelect={setSelected}
        />
      </section>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="label-mono text-muted-foreground">query time</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Query pipeline */}
      <section>
        <h2 className="label-mono mb-6 text-muted-foreground">
          Phase 2 — Query Pipeline (Per Request)
        </h2>
        <PipelineRow
          nodes={QUERY_NODES}
          selected={selected}
          onSelect={setSelected}
        />
      </section>

      {/* Detail panel */}
      {selectedNode && (
        <div className="animate-fade-up rounded-md border border-evidence/30 bg-evidence-soft/40 p-6 shadow-panel">
          <div className="flex items-start gap-4">
            <selectedNode.icon className={cn("mt-0.5 size-6 shrink-0", selectedNode.color)} />
            <div>
              <h3 className="font-serif text-xl">{selectedNode.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/80">
                {selectedNode.detail}
              </p>
              {selectedNode.config && (
                <p className="mt-3 rounded-md bg-card/80 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  {selectedNode.config}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Design principles */}
      <section className="grid gap-4 sm:grid-cols-3">
        <PrincipleCard
          title="Refuse ≠ Failure"
          body="When the source doesn't cover a question, returning 'Insufficient Evidence' is the correct output — not a bug."
        />
        <PrincipleCard
          title="Fluent ≠ Safe"
          body="A confident-sounding LLM answer is dangerous without citations. Every claim must link back to a retrieved chunk."
        />
        <PrincipleCard
          title="Boundary = Feature"
          body="The threshold gate, risk classifier, and citation validator form three independent safety layers."
        />
      </section>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────────── */

function PipelineRow({
  nodes,
  selected,
  onSelect,
}: {
  nodes: ArchNode[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-0">
      {nodes.map((node, i) => (
        <div key={node.id} className="flex items-center">
          <button
            onClick={() => onSelect(selected === node.id ? null : node.id)}
            className={cn(
              "group relative flex flex-col items-center rounded-xl border-2 bg-card p-4 shadow-panel transition-all hover:shadow-lg",
              selected === node.id
                ? "border-evidence bg-evidence-soft scale-105"
                : "border-border hover:border-evidence/40",
            )}
            style={{ minWidth: 110 }}
          >
            {selected === node.id && (
              <span className="absolute -inset-1 animate-pulse rounded-xl bg-evidence/10 blur-md" />
            )}
            <node.icon className={cn("relative z-10 size-7", node.color)} />
            <span className="relative z-10 mt-2 text-center font-mono text-[10px] leading-tight text-foreground/80">
              {node.label}
            </span>
          </button>

          {i < nodes.length - 1 && (
            <div className="mx-2 flex items-center">
              <div className="h-[2px] w-6 bg-border sm:w-10" />
              <ArrowRight className="size-3 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function PrincipleCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-panel">
      <h3 className="font-serif text-lg">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}
