import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ShieldAlert, FileSearch } from "lucide-react";
import { ask } from "@/lib/grounded.functions";
import type { AskResponse } from "@/lib/grounded.types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { StageTracker, STAGES } from "./StageTracker";
import { ClaimCard } from "./ClaimCard";
import { EvidencePanel } from "./EvidencePanel";
import { ModeBadge } from "./ModeBadge";
import { cn } from "@/lib/utils";

export function useAskController() {
  const askFn = useServerFn(ask);
  const [question, setQuestion] = useState("");
  const [stage, setStage] = useState(-1);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const submit = useCallback(
    async (q: string) => {
      const text = q.trim();
      if (!text) return;
      timers.current.forEach(clearTimeout);
      timers.current = [];
      setQuestion(text);
      setResult(null);
      setError(null);
      setStage(0);
      // stages advance while the single /ask call is in flight; the final
      // stage only resolves when the real response lands.
      [1, 2, 3].forEach((s, i) => {
        timers.current.push(setTimeout(() => setStage(s), 220 * (i + 1)));
      });
      try {
        const res = await askFn({ data: { question: text } });
        timers.current.forEach(clearTimeout);
        setStage(STAGES.length - 1);
        setTimeout(() => {
          setStage(STAGES.length);
          setResult(res);
        }, 180);
      } catch {
        timers.current.forEach(clearTimeout);
        setStage(-1);
        setError("The evidence service could not complete this request.");
      }
    },
    [askFn],
  );

  return { question, setQuestion, stage, result, error, submit };
}

export function AskConsole({
  controller,
  showInput = true,
}: {
  controller: ReturnType<typeof useAskController>;
  showInput?: boolean;
}) {
  const { question, setQuestion, stage, result, error, submit } = controller;
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const running = stage >= 0 && stage < STAGES.length;

  return (
    <div className="space-y-8">
      {showInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(question);
          }}
          className="rounded-md border border-border bg-paper shadow-panel"
        >
          <label
            htmlFor="q"
            className="label-mono block border-b border-border px-5 py-3 text-muted-foreground"
          >
            Query · scope: USPSTF skin cancer prevention counseling
          </label>
          <textarea
            id="q"
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit(question);
              }
            }}
            placeholder="Ask about sun protection, UV exposure, or screening — sourced from the USPSTF guideline"
            className="w-full resize-none bg-transparent px-5 py-4 font-serif text-lg leading-relaxed outline-none placeholder:font-sans placeholder:text-base placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-3 border-t border-border px-5 py-3">
            <span className="font-mono text-[11px] text-muted-foreground">
              chunk_size=500 · overlap=75 · top_k=5
            </span>
            <button
              type="submit"
              disabled={running}
              className="ml-auto inline-flex items-center gap-2 rounded-[4px] bg-primary px-4 py-2 font-mono text-[12px] uppercase tracking-widest text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Run pipeline <ArrowRight className="size-3.5" />
            </button>
          </div>
        </form>
      )}

      {stage >= 0 && <StageTracker current={stage} />}

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-5 py-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <ResultHeader result={result} />
            {result.status === "Answered" ? (
              <>
                <div className="rounded-md border border-border bg-paper p-6 shadow-panel">
                  <div className="label-mono mb-2 text-muted-foreground">
                    Recommendation
                  </div>
                  <h2 className="font-serif text-2xl leading-snug">
                    {result.recommendation}
                  </h2>
                </div>
                <div className="space-y-4">
                  <div className="label-mono text-muted-foreground">
                    Supporting evidence · {result.supporting_evidence.length} claims ·{" "}
                    {result.validation.citations_verified} citations verified
                  </div>
                  {result.supporting_evidence.map((item, i) => (
                    <ClaimCard
                      key={item.citation.chunk_id}
                      item={item}
                      index={i}
                      onHover={setHighlighted}
                    />
                  ))}
                </div>
              </>
            ) : (
              <BoundaryState result={result} />
            )}

            {result.missing_information && result.status === "Answered" && (
              <p className="rounded-md border border-boundary/30 bg-boundary-soft px-5 py-4 text-sm text-boundary">
                <span className="label-mono mr-2">Missing information</span>
                {result.missing_information}
              </p>
            )}
            {result.safety_note && (
              <p className="border-l-2 border-rule pl-4 text-sm text-muted-foreground">
                <span className="label-mono mr-2">Safety note</span>
                {result.safety_note}
              </p>
            )}
          </div>

          <div className="space-y-6">
            <ConfidenceBadge
              confidence={result.confidence}
              status={result.status}
            />
            <EvidencePanel
              chunks={result.retrieved_chunks}
              threshold={result.weak_threshold}
              highlighted={highlighted}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ResultHeader({ result }: { result: AskResponse }) {
  const tone =
    result.status === "Answered"
      ? "border-evidence/40 bg-evidence-soft text-evidence"
      : result.status === "Insufficient Evidence"
        ? "border-boundary/40 bg-boundary-soft text-boundary"
        : "border-refusal/40 bg-refusal-soft text-refusal";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn("label-mono rounded-[3px] border px-3 py-1.5", tone)}>
        {result.status}
      </span>
      <span className="label-mono rounded-[3px] border border-border px-3 py-1.5 text-muted-foreground">
        risk_tier: {result.risk_tier}
      </span>
      <span className="label-mono rounded-[3px] border border-border px-3 py-1.5 text-muted-foreground">
        decision_path: {result.decision_path}
      </span>
      <ModeBadge mode={result.mode} />
    </div>
  );
}

function BoundaryState({ result }: { result: AskResponse }) {
  const refusal = result.status === "Safety Refusal";
  const Icon = refusal ? ShieldAlert : FileSearch;
  return (
    <div
      className={cn(
        "rounded-md border p-6 shadow-panel",
        refusal
          ? "border-refusal/40 bg-refusal-soft"
          : "border-boundary/40 bg-boundary-soft",
      )}
    >
      <div className="flex items-start gap-4">
        <Icon
          className={cn(
            "mt-1 size-6 shrink-0",
            refusal ? "text-refusal" : "text-boundary",
          )}
        />
        <div>
          <h2
            className={cn(
              "font-serif text-2xl leading-snug",
              refusal ? "text-refusal" : "text-boundary",
            )}
          >
            {result.recommendation}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/75">
            {result.missing_information}
          </p>
          <p className="label-mono mt-4 text-muted-foreground">
            This is expected behaviour — the system declined rather than
            generating unsupported text.
          </p>
        </div>
      </div>
    </div>
  );
}
