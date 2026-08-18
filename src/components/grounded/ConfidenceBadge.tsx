import type { Confidence, Status } from "@/lib/grounded.types";
import { cn } from "@/lib/utils";

const toneFor = (status: Status) =>
  status === "Answered"
    ? "border-evidence/40 bg-evidence-soft text-evidence"
    : status === "Insufficient Evidence"
      ? "border-boundary/40 bg-boundary-soft text-boundary"
      : "border-refusal/40 bg-refusal-soft text-refusal";

export function ConfidenceBadge({
  confidence,
  status,
}: {
  confidence: Confidence;
  status: Status;
}) {
  const bars = { High: 3, Medium: 2, Low: 1, "Insufficient Evidence": 0 }[
    confidence
  ];
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-md border px-5 py-4",
        toneFor(status),
      )}
    >
      <div className="flex items-end gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              "w-2 rounded-[2px] border border-current",
              i === 0 ? "h-3" : i === 1 ? "h-5" : "h-7",
              i < bars ? "bg-current" : "opacity-30",
            )}
          />
        ))}
      </div>
      <div className="leading-tight">
        <div className="label-mono opacity-70">Confidence</div>
        <div className="font-serif text-xl">{confidence}</div>
      </div>
    </div>
  );
}
