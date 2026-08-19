import type { Confidence, Status } from "@/lib/grounded.types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const toneFor = (status: Status) =>
  status === "Answered"
    ? "border-evidence/40 bg-evidence-soft text-evidence"
    : status === "Insufficient Evidence"
      ? "border-boundary/40 bg-boundary-soft text-boundary"
      : "border-refusal/40 bg-refusal-soft text-refusal";

const colorFor = (status: Status) =>
  status === "Answered"
    ? { stroke: "oklch(0.42 0.09 168)", glow: "oklch(0.42 0.09 168 / 0.3)" }
    : status === "Insufficient Evidence"
      ? { stroke: "oklch(0.52 0.07 75)", glow: "oklch(0.52 0.07 75 / 0.3)" }
      : { stroke: "oklch(0.4 0.06 285)", glow: "oklch(0.4 0.06 285 / 0.3)" };

/** Arc gauge: renders a 240° sweep from 150° to 390°. */
export function ConfidenceBadge({
  confidence,
  status,
  topScore,
  threshold,
}: {
  confidence: Confidence;
  status: Status;
  topScore?: number;
  threshold?: number;
}) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const score = topScore ?? 0;
  const threshVal = threshold ?? 0.68;
  const colors = colorFor(status);

  // Animate on mount
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  // SVG arc math
  const cx = 60, cy = 60, r = 46;
  const startAngle = 150; // bottom-left
  const sweepAngle = 240; // 240° total arc

  const polarToCartesian = (angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (start: number, end: number) => {
    const s = polarToCartesian(start);
    const e = polarToCartesian(end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  };

  // Positions
  const endAngle = startAngle + sweepAngle;
  const scoreAngle = startAngle + animatedScore * sweepAngle;
  const threshAngle = startAngle + threshVal * sweepAngle;
  const threshPt = polarToCartesian(threshAngle);

  return (
    <div className={cn("rounded-md border p-5 shadow-panel", toneFor(status))}>
      <div className="label-mono mb-3 opacity-70">Retrieval confidence</div>

      <div className="flex items-center gap-5">
        {/* Arc gauge */}
        <div className="relative shrink-0">
          <svg width={120} height={100} viewBox="0 0 120 110" fill="none">
            {/* Glow filter */}
            <defs>
              <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
              </filter>
            </defs>

            {/* Track */}
            <path
              d={describeArc(startAngle, endAngle)}
              stroke="currentColor"
              strokeWidth={6}
              strokeLinecap="round"
              fill="none"
              className="opacity-15"
            />

            {/* Glow behind fill */}
            {animatedScore > 0 && (
              <path
                d={describeArc(startAngle, scoreAngle)}
                stroke={colors.stroke}
                strokeWidth={8}
                strokeLinecap="round"
                fill="none"
                filter="url(#gauge-glow)"
                style={{
                  opacity: 0.5,
                  transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            )}

            {/* Fill arc */}
            <path
              d={describeArc(startAngle, scoreAngle)}
              stroke={colors.stroke}
              strokeWidth={5}
              strokeLinecap="round"
              fill="none"
              style={{
                transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />

            {/* Threshold tick mark */}
            {threshold !== undefined && (
              <g>
                <line
                  x1={threshPt.x}
                  y1={threshPt.y}
                  x2={cx + (r + 8) * Math.cos(((threshAngle - 90) * Math.PI) / 180)}
                  y2={cy + (r + 8) * Math.sin(((threshAngle - 90) * Math.PI) / 180)}
                  stroke="currentColor"
                  strokeWidth={2}
                  className="opacity-50"
                />
                <text
                  x={cx + (r + 15) * Math.cos(((threshAngle - 90) * Math.PI) / 180)}
                  y={cy + (r + 15) * Math.sin(((threshAngle - 90) * Math.PI) / 180)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-current font-mono text-[8px] opacity-40"
                >
                  {threshVal.toFixed(2)}
                </text>
              </g>
            )}

            {/* Center score */}
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-current font-mono text-[22px] font-semibold"
              style={{
                transition: "all 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {confidence === "N/A" ? "✕" : animatedScore > 0 ? animatedScore.toFixed(2) : "—"}
            </text>
            <text
              x={cx}
              y={cy + 14}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-current font-mono text-[8px] opacity-50"
            >
              top score
            </text>
          </svg>
        </div>

        {/* Text info */}
        <div className="min-w-0 flex-1">
          <div className="font-serif text-xl">{confidence === "N/A" ? "Refused" : confidence}</div>
          <div className="mt-1.5 font-mono text-[11px] opacity-60">
            {confidence === "N/A"
              ? "Query blocked pre-retrieval by safety classifier"
              : score > 0 && threshold !== undefined
                ? score >= threshVal
                  ? `Score ${score.toFixed(3)} exceeds threshold ${threshVal}`
                  : `Score ${score.toFixed(3)} below threshold ${threshVal}`
                : "No retrieval score available"}
          </div>

          {/* Mini bar indicators */}
          <div className="mt-3 flex items-end gap-1" aria-hidden>
            {[0, 1, 2].map((i) => {
              const bars = { High: 3, Medium: 2, Low: 1, "Insufficient Evidence": 0, "N/A": 0 }[
                confidence
              ] ?? 0;
              return (
                <span
                  key={i}
                  className={cn(
                    "w-2 rounded-[2px] border border-current transition-all duration-500",
                    i === 0 ? "h-3" : i === 1 ? "h-5" : "h-7",
                    i < bars ? "bg-current" : "opacity-20",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
