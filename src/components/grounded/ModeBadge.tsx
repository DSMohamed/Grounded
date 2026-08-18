import { useEffect, useState } from "react";
import { Sparkles, Cpu } from "lucide-react";

export function ModeBadge({ mode }: { mode?: "live" | "simulated" }) {
  const [detectedMode, setDetectedMode] = useState<"live" | "simulated" | null>(mode || null);

  useEffect(() => {
    if (mode) {
      setDetectedMode(mode);
      return;
    }
    // Check backend health on initial load
    fetch("http://localhost:8000/health")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.llm_mode) {
          setDetectedMode(data.llm_mode === "live" ? "live" : "simulated");
        }
      })
      .catch(() => {
        setDetectedMode("simulated");
      });
  }, [mode]);

  if (!detectedMode) return null;

  if (detectedMode === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
        Live OpenRouter
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400">
      <Cpu className="size-3 text-amber-600 dark:text-amber-400" />
      Simulation Mode
    </span>
  );
}
