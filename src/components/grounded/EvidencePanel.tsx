import type { RetrievedChunk } from "@/lib/grounded.types";
import { cn } from "@/lib/utils";

export function EvidencePanel({
  chunks,
  threshold,
  highlighted,
}: {
  chunks: RetrievedChunk[];
  threshold: number;
  highlighted?: string | null;
}) {
  return (
    <aside className="rounded-md border border-border bg-paper">
      <header className="flex items-baseline justify-between border-b border-border px-5 py-3">
        <h2 className="label-mono text-foreground">Evidence Panel</h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          top_k={chunks.length} · weak_threshold={threshold}
        </span>
      </header>
      {chunks.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">
          No retrieval was performed for this query.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {chunks.map((c) => {
            const weak = c.score < threshold;
            return (
              <li
                key={c.chunk_id}
                className={cn(
                  "px-5 py-4 transition-colors",
                  highlighted === c.chunk_id && "bg-evidence-soft",
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-evidence">
                    {c.chunk_id}
                  </span>
                  <span
                    className={cn(
                      "ml-auto font-mono text-[11px]",
                      weak ? "text-boundary" : "text-foreground",
                    )}
                  >
                    {c.score.toFixed(3)}
                  </span>
                </div>
                <div className="mt-1 h-1 w-full rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-1 rounded-full",
                      weak ? "bg-boundary" : "bg-evidence",
                    )}
                    style={{ width: `${Math.min(100, c.score * 100)}%` }}
                  />
                </div>
                <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                  {c.section} · p.{c.page}
                </div>
                <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-foreground/80">
                  {c.text}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
