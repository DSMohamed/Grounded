import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { EvidenceItem } from "@/lib/grounded.types";
import { cn } from "@/lib/utils";

export function ClaimCard({
  item,
  index,
  onHover,
}: {
  item: EvidenceItem;
  index: number;
  onHover?: (chunkId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const c = item.citation;

  return (
    <article
      onMouseEnter={() => onHover?.(c.chunk_id)}
      onMouseLeave={() => onHover?.(null)}
      className="group relative rounded-md border border-border bg-card pl-5 shadow-panel"
    >
      <span className="absolute inset-y-0 left-0 w-1 rounded-l-md bg-evidence/70" />
      <div className="p-5 pl-4">
        <div className="label-mono mb-2 text-muted-foreground">
          Claim {String(index + 1).padStart(2, "0")}
        </div>
        <p className="text-[15px] leading-relaxed text-foreground">{item.claim}</p>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "mt-4 flex w-full items-center gap-2 rounded-[4px] border border-evidence/30 bg-evidence-soft px-3 py-2 text-left font-mono text-[11px] text-evidence transition-colors hover:bg-evidence/10",
          )}
          aria-expanded={open}
        >
          <span className="truncate">
            [{c.document} | {c.section} | Page {c.page} | {c.chunk_id}]
          </span>
          <ChevronDown
            className={cn(
              "ml-auto size-3.5 shrink-0 transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open && item.passage && (
          <div className="animate-stage-in mt-3 border-l-2 border-evidence/40 bg-muted/60 px-4 py-3">
            <div className="label-mono mb-1 text-muted-foreground">
              Retrieved passage
            </div>
            <p className="font-serif text-[15px] leading-relaxed text-foreground/90">
              {item.passage}
            </p>
          </div>
        )}
      </div>
    </article>
  );
}
