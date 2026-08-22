import { useState } from "react";
import {
  ChevronDown,
  ShieldAlert,
  FileSearch,
  BadgeCheck,
  BookOpen,
  Cpu,
  Layers,
} from "lucide-react";
import type { ChatMessage as ChatMessageType, AskResponse, TokenUsage } from "@/lib/grounded.types";
import { StageTracker } from "./StageTracker";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: ChatMessageType;
  cumulativeTokens?: number;
  remainingBudget?: number;
  sessionBudget?: number;
}

export function ChatMessage({
  message,
  cumulativeTokens,
  remainingBudget,
  sessionBudget = 8192,
}: ChatMessageProps) {
  if (message.role === "user") return <UserBubble text={message.content} />;
  return (
    <AssistantBubble
      message={message}
      cumulativeTokens={cumulativeTokens}
      remainingBudget={remainingBudget}
      sessionBudget={sessionBudget}
    />
  );
}

/* ── User bubble ───────────────────────────────────────────────────────── */

function UserBubble({ text }: { text: string }) {
  const estimatedTokens = Math.max(8, Math.floor(text.split(/\s+/).filter(Boolean).length * 1.3));

  return (
    <div className="flex flex-col items-end gap-1 animate-fade-up">
      <div className="max-w-[88%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-evidence/15 border border-evidence/20 px-4 py-2.5 sm:px-5 sm:py-3.5 shadow-sm">
        <p className="text-[14px] sm:text-[15px] leading-relaxed text-foreground">{text}</p>
      </div>
      <span className="mr-1 font-mono text-[9.5px] text-muted-foreground/60 tabular-nums">
        ~{estimatedTokens} input tokens
      </span>
    </div>
  );
}

/* ── Assistant bubble ──────────────────────────────────────────────────── */

function AssistantBubble({
  message,
  cumulativeTokens,
  remainingBudget,
  sessionBudget = 8192,
}: {
  message: ChatMessageType;
  cumulativeTokens?: number;
  remainingBudget?: number;
  sessionBudget?: number;
}) {
  const [showEvidence, setShowEvidence] = useState(false);
  const [showTokenDetails, setShowTokenDetails] = useState(false);
  const [expandedClaim, setExpandedClaim] = useState<number | null>(null);
  const isLoading = message.stage !== undefined && message.stage >= 0 && message.stage < 5;
  const result = message.response;
  const tokenUsage = getOrEstimateTokens(result, message.content);

  const turnTokens = tokenUsage?.total_tokens ?? 0;
  const cumulative = cumulativeTokens ?? turnTokens;
  const remaining = remainingBudget !== undefined ? remainingBudget : Math.max(0, sessionBudget - cumulative);

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
        {/* Label and Header Metadata */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-medium text-evidence">Grounded</span>
          {result && (
            <StatusTag status={result.status} />
          )}
          {message.elapsedMs !== undefined && message.elapsedMs > 0 && (
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
              {message.elapsedMs >= 1000 ? `${(message.elapsedMs / 1000).toFixed(1)}s` : `${message.elapsedMs}ms`}
            </span>
          )}
          {tokenUsage && (
            <button
              onClick={() => setShowTokenDetails(!showTokenDetails)}
              title="Click to view full token usage breakdown and remaining context budget"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] tabular-nums transition-colors cursor-pointer",
                showTokenDetails
                  ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-400 font-medium"
                  : "border-cyan-500/25 bg-cyan-500/5 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 hover:border-cyan-500/40"
              )}
            >
              <Cpu className="size-3 shrink-0 opacity-80" />
              <span>{turnTokens.toLocaleString()} tok used</span>
              <span className="opacity-50">·</span>
              <span className="font-semibold text-foreground/85">{remaining.toLocaleString()} rem</span>
            </button>
          )}
        </div>

        {/* Token Details Expansion Drawer */}
        {tokenUsage && showTokenDetails && (
          <TokenDetailsPanel
            usage={tokenUsage}
            cumulativeTokens={cumulative}
            remainingBudget={remaining}
            sessionBudget={sessionBudget}
            onClose={() => setShowTokenDetails(false)}
          />
        )}

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
            <div className="rounded-xl bg-card/60 border border-border/60 p-4 shadow-sm">
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
                {tokenUsage && (
                  <span
                    onClick={() => setShowTokenDetails(!showTokenDetails)}
                    className="cursor-pointer rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 font-mono text-[10px] text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15"
                  >
                    {cumulative.toLocaleString()} / {sessionBudget.toLocaleString()} total ({((cumulative / sessionBudget) * 100).toFixed(1)}% chat budget)
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Token details drawer ────────────────────────────────────────────────── */

function TokenDetailsPanel({
  usage,
  cumulativeTokens,
  remainingBudget,
  sessionBudget,
  onClose,
}: {
  usage: TokenUsage;
  cumulativeTokens: number;
  remainingBudget: number;
  sessionBudget: number;
  onClose: () => void;
}) {
  const percentUsed = Math.min(100, Math.max(1, (cumulativeTokens / sessionBudget) * 100));

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-card/80 p-3.5 shadow-md backdrop-blur-sm animate-fade-up space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-cyan-500" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-foreground">
            Token Usage & Cumulative Budget
          </span>
        </div>
        <button
          onClick={onClose}
          className="font-mono text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted/30"
        >
          Close
        </button>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="rounded-lg bg-muted/30 border border-border/40 p-2">
          <div className="font-mono text-[9px] uppercase text-muted-foreground">This Turn (Input)</div>
          <div className="font-mono text-[13px] font-semibold text-foreground mt-0.5 tabular-nums">
            {usage.prompt_tokens.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 border border-border/40 p-2">
          <div className="font-mono text-[9px] uppercase text-muted-foreground">This Turn (Output)</div>
          <div className="font-mono text-[13px] font-semibold text-evidence mt-0.5 tabular-nums">
            {usage.completion_tokens.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 border border-border/40 p-2">
          <div className="font-mono text-[9px] uppercase text-muted-foreground">Chat Total Consumed</div>
          <div className="font-mono text-[13px] font-semibold text-cyan-600 dark:text-cyan-400 mt-0.5 tabular-nums">
            {cumulativeTokens.toLocaleString()}
          </div>
        </div>

        <div className="rounded-lg bg-muted/30 border border-border/40 p-2">
          <div className="font-mono text-[9px] uppercase text-muted-foreground">Budget Remaining</div>
          <div className="font-mono text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {remainingBudget.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
          <span>Conversation budget headroom</span>
          <span>{remainingBudget.toLocaleString()} of {sessionBudget.toLocaleString()} tokens left ({percentUsed.toFixed(1)}% used)</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-evidence to-emerald-500 transition-all duration-500"
            style={{ width: `${percentUsed}%` }}
          />
        </div>
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

function getOrEstimateTokens(result?: AskResponse, fallbackText?: string): TokenUsage | null {
  if (result?.token_usage) return result.token_usage;
  if (!result && !fallbackText) return null;

  const promptText =
    (result?.supporting_evidence?.map((e) => e.claim + " " + (e.passage || "")).join(" ") || "") +
    " " +
    (fallbackText || "");
  const compText = result?.recommendation || fallbackText || "";

  const prompt_tokens = Math.max(40, Math.floor(promptText.split(/\s+/).filter(Boolean).length * 1.3) + 120);
  const completion_tokens = Math.max(15, Math.floor(compText.split(/\s+/).filter(Boolean).length * 1.3));
  const total_tokens = prompt_tokens + completion_tokens;
  const max_context_tokens = 8192;
  const remaining_tokens = Math.max(0, max_context_tokens - total_tokens);

  return {
    prompt_tokens,
    completion_tokens,
    total_tokens,
    max_context_tokens,
    remaining_tokens,
  };
}
