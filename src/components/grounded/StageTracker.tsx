import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const STAGES = [
  "Classifying query",
  "Retrieving evidence",
  "Checking confidence threshold",
  "Generating grounded answer",
  "Validating citations",
] as const;

export function StageTracker({ current }: { current: number }) {
  return (
    <ol className="divide-y divide-border rounded-md border border-border bg-card">
      {STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={stage}
            className={cn(
              "flex items-center gap-3 px-5 py-3 transition-colors",
              active && "bg-evidence-soft",
              !done && !active && "opacity-40",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-[3px] border",
                done
                  ? "border-evidence bg-evidence text-evidence-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : active ? (
                <Loader2 className="size-3 animate-spin" />
              ) : null}
            </span>
            <span className="label-mono text-foreground/80">{stage}</span>
            <span className="ml-auto font-mono text-[11px] text-muted-foreground">
              {done ? "ok" : active ? "…" : "pending"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
