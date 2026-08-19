import { useState } from "react";
import {
  ChevronDown,
  ShieldAlert,
  FileSearch,
  BadgeCheck,
  Check,
  BookOpen,
} from "lucide-react";
import type { ChatMessage as ChatMessageType, AskResponse } from "@/lib/grounded.types";
import { StageTracker } from "./StageTracker";
import { cn } from "@/lib/utils";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  if (message.role === "user") return <UserBubble text={message.content} />;
  return (
    <AssistantBubble
      message={message}
    />
  );
}

/* ── User bubble ───────────────────────────────────────────────────────── */

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-up">
      <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-evidence/15 border border-evidence/20 px-4 py-2.5 sm:px-5 sm:py-3.5">
        <p className="text-[14px] sm:text-[15px] leading-relaxed text-foreground">{text}</p>
      </div>
    </div>
  );
}

/* ── Assistant bubble ──────────────────────────────────────────────────── */

function AssistantBubble({ message }: { message: ChatMessageType }) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);
  const isLoading = message.stage !== undefined && message.stage >= 0 && message.stage < 5;
  const result = message.response;

  return (
    <div className="flex gap-3 animate-fade-up">
      {/* Avatar */}
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-evidence/15 border border-evidence/20">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-evidence">
          <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" opacity="0.3" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-3">
        {/* Label */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-medium text-evidence">Grounded</span>
          {result && (
            <StatusTag status={result.status} />
          )}
          {message.elapsedMs !== undefined && message.elapsedMs > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {message.elapsedMs >= 1000 ? `${(message.elapsedMs / 1000).toFixed(1)}s` : `${message.elapsedMs}ms`}
            </span>
          )}
        </div>

        {/* Loading state — pipeline tracker */}
        {isLoading && (
          <div className="max-w-lg">
            <StageTracker current={message.stage ?? 0} elapsedMs={message.elapsedMs} />
          </div>
        )}

        {/* Result content */}
        {result && (
          <div className="space-y-3">
            {/* Recommendation text */}
            <div className="rounded-xl bg-card/60 border border-border/60 p-4">
              <p className="text-[15px] leading-relaxed text-foreground">
                {result.recommendation}
              </p>

              {/* Safety note */}
              {result.safety_note && (
                <p className="mt-3 border-t border-border/40 pt-3 text-[12px] text-muted-foreground leading-relaxed">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1.5">Safety</span>
                  {result.safety_note}
                </p>
              )}
            </div>

            {/* Refusal / Insufficient Evidence detailed state */}
            {result.status !== "Answered" && result.missing_information && (
              <RefusalDetail result={result} />
            )}

            {/* Evidence section — only for answered */}
            {result.status === "Answered" && result.supporting_evidence.length > 0 && (
              <div className="space-y-2">
                <button
                  onClick={() => setShowEvidence(!showEvidence)}
                  className="inline-flex items-center gap-2 rounded-lg border border-evidence/20 bg-evidence/5 px-3 py-2 font-mono text-[11px] text-evidence transition-colors hover:bg-evidence/10"
                >
                  <BookOpen className="size-3.5" />
                  {result.supporting_evidence.length} claims · {result.validation.citations_verified} verified
                  <ChevronDown className={cn("size-3 transition-transform", showEvidence && "rotate-180")} />
                </button>

                {showEvidence && (
                  <div className="space-y-2 animate-fade-up">
                    {result.supporting_evidence.map((item, i) => (
                      <div
                        key={item.citation.chunk_id}
                        className="rounded-lg border border-border/50 bg-card/40 overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedClaim(expandedClaim === i ? null : i)}
                          className="flex w-full items-start gap-3 p-3 text-left transition-colors hover:bg-evidence/5"
                        >
                          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-evidence/15 font-mono text-[10px] text-evidence">
                            {i + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-relaxed text-foreground/90">{item.claim}</p>
                            <p className="mt-1 font-mono text-[10px] text-muted-foreground truncate">
                              {item.citation.section} · p.{item.citation.page} · {item.citation.chunk_id}
                            </p>
                          </div>
                          <ChevronDown className={cn("mt-1 size-3 shrink-0 text-muted-foreground transition-transform", expandedClaim === i && "rotate-180")} />
                        </button>

                        {expandedClaim === i && item.passage && (
                          <div className="border-t border-border/30 bg-muted/20 px-4 py-3 animate-fade-up">
                            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1.5">Retrieved passage</p>
                            <p className="text-[13px] leading-relaxed text-foreground/75 font-serif">{item.passage}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Missing information */}
                    {result.missing_information && (
                      <p className="rounded-lg bg-boundary/5 border border-boundary/20 px-3 py-2 text-[12px] text-boundary">
                        <span className="font-mono text-[10px] uppercase tracking-wider mr-1">Gap</span>
                        {result.missing_information}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Compact metadata row */}
            {result.status === "Answered" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <MetaChip label={`confidence: ${result.confidence}`} />
                <MetaChip label={`risk: ${result.risk_tier}`} />
                <MetaChip label={`score: ${result.top_score.toFixed(3)}`} />
                <MetaChip label={`mode: ${result.mode}`} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function StatusTag({ status }: { status: string }) {
  const tone =
    status === "Answered"
      ? "border-evidence/30 bg-evidence/10 text-evidence"
      : status === "Insufficient Evidence"
        ? "border-boundary/30 bg-boundary/10 text-boundary"
        : "border-refusal/30 bg-refusal/10 text-refusal";
  const Icon = status === "Safety Refusal" ? ShieldAlert : status === "Answered" ? BadgeCheck : FileSearch;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px]", tone)}>
      <Icon className="size-3" />
      {status}
    </span>
  );
}

function MetaChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
      {label}
    </span>
  );
}

function RefusalDetail({ result }: { result: AskResponse }) {
  const refusal = result.status === "Safety Refusal";
  const Icon = refusal ? ShieldAlert : FileSearch;
  return (
    <div className={cn(
      "rounded-lg border p-4",
      refusal ? "border-refusal/20 bg-refusal/5" : "border-boundary/20 bg-boundary/5",
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn("mt-0.5 size-4 shrink-0", refusal ? "text-refusal" : "text-boundary")} />
        <div>
          <p className="text-[13px] leading-relaxed text-foreground/75">{result.missing_information}</p>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            Expected — the system declined rather than generating unsupported text.
          </p>
        </div>
      </div>
    </div>
  );
}
