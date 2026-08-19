import { Check, Loader2, Shield, Search, Gauge, Brain, BadgeCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const STAGES = [
  "Classifying query",
  "Retrieving evidence",
  "Checking confidence threshold",
  "Generating grounded answer",
  "Validating citations",
] as const;

const STAGE_ICONS: LucideIcon[] = [Shield, Search, Gauge, Brain, BadgeCheck];
const STAGE_SHORT = ["Risk", "Retrieve", "Threshold", "Generate", "Validate"];

export function StageTracker({ current, elapsedMs }: { current: number; elapsedMs?: number }) {
  return (
    <div className="rounded-md border border-border bg-card p-5 shadow-panel">
      {/* Header with elapsed time */}
      <div className="mb-4 flex items-center justify-between">
        <span className="label-mono text-muted-foreground">Pipeline execution</span>
        {typeof elapsedMs === "number" && (
          <span className="font-mono text-xs tabular-nums text-evidence">
            {elapsedMs >= 1000
              ? `${(elapsedMs / 1000).toFixed(1)}s`
              : `${elapsedMs}ms`}
          </span>
        )}
      </div>

      {/* Flow diagram */}
      <div className="flex items-center gap-0">
        {STAGES.map((stage, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = STAGE_ICONS[i]!;

          return (
            <div key={stage} className="flex items-center" style={{ flex: 1 }}>
              {/* Node */}
              <div className="group relative flex flex-col items-center" style={{ minWidth: 56 }}>
                {/* Glow behind active node */}
                {active && (
                  <span className="absolute -inset-2 animate-pulse rounded-xl bg-evidence/15 blur-md" />
                )}
                <div
                  className={cn(
                    "relative z-10 flex size-10 items-center justify-center rounded-lg border-2 transition-all duration-300",
                    done
                      ? "border-evidence bg-evidence text-evidence-foreground shadow-[0_0_12px_oklch(0.42_0.09_168/0.4)]"
                      : active
                        ? "border-evidence bg-evidence-soft text-evidence shadow-[0_0_16px_oklch(0.42_0.09_168/0.3)]"
                        : "border-border bg-card text-muted-foreground/50",
                  )}
                >
                  {done ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : active ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "mt-2 text-center font-mono text-[10px] leading-tight transition-colors duration-300",
                    done
                      ? "text-evidence"
                      : active
                        ? "text-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {STAGE_SHORT[i]}
                </span>

                {/* Tooltip on hover */}
                <div className="absolute -top-12 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 font-mono text-[10px] text-muted-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                  {stage}
                  {done && <span className="ml-2 text-evidence">✓</span>}
                  {active && <span className="ml-2 text-evidence">running…</span>}
                </div>
              </div>

              {/* Connector line with animated particle */}
              {i < STAGES.length - 1 && (
                <div className="relative mx-1 flex-1" style={{ minWidth: 20 }}>
                  {/* Base line */}
                  <div
                    className={cn(
                      "h-[2px] w-full rounded-full transition-colors duration-500",
                      i < current
                        ? "bg-evidence"
                        : i === current
                          ? "bg-evidence/40"
                          : "bg-border",
                    )}
                  />

                  {/* Animated glow overlay for completed connections */}
                  {i < current && (
                    <div className="absolute inset-0 h-[2px] rounded-full bg-evidence shadow-[0_0_8px_oklch(0.42_0.09_168/0.5)]" />
                  )}

                  {/* Moving particle for active connection */}
                  {i === current && (
                    <div className="absolute top-1/2 -translate-y-1/2">
                      <span
                        className="block size-2 rounded-full bg-evidence shadow-[0_0_8px_oklch(0.42_0.09_168/0.8)]"
                        style={{
                          animation: "pipeline-particle 1.2s ease-in-out infinite",
                        }}
                      />
                    </div>
                  )}

                  {/* Dotted line for pending connections */}
                  {i >= current && i < current && (
                    <div
                      className="absolute inset-0 h-[2px]"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(90deg, var(--border) 0px, var(--border) 4px, transparent 4px, transparent 8px)",
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage detail bar */}
      {current >= 0 && current < STAGES.length && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-evidence-soft/60 px-4 py-2 animate-stage-in">
          <Loader2 className="size-3 animate-spin text-evidence" />
          <span className="font-mono text-[11px] text-evidence">
            {STAGES[current]}…
          </span>
        </div>
      )}

      {/* All done bar */}
      {current >= STAGES.length && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-evidence-soft px-4 py-2 animate-stage-in">
          <Check className="size-3 text-evidence" strokeWidth={3} />
          <span className="font-mono text-[11px] text-evidence">
            Pipeline complete
            {typeof elapsedMs === "number" && (
              <span className="ml-2 text-foreground/60">
                in {elapsedMs >= 1000 ? `${(elapsedMs / 1000).toFixed(1)}s` : `${elapsedMs}ms`}
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
