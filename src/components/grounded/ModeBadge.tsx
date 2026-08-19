import { useEffect, useState } from "react";
import { Sparkles, Cpu, Zap } from "lucide-react";
import { API_BASE_URL } from "../../lib/config";

export function ModeBadge({ mode }: { mode?: "live" | "simulated" | string }) {
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    if (mode) {
      const modeStr = String(mode).toLowerCase();
      if (modeStr.includes("groq")) {
        setActiveLabel("Live Groq");
        setIsLive(true);
      } else if (modeStr.includes("openrouter")) {
        setActiveLabel("Live OpenRouter");
        setIsLive(true);
      } else if (modeStr.includes("grok")) {
        setActiveLabel("Live Grok");
        setIsLive(true);
      } else if (modeStr.startsWith("live")) {
        setActiveLabel("Live LLM");
        setIsLive(true);
      } else {
        setActiveLabel("Simulation Mode");
        setIsLive(false);
      }
      return;
    }

    // Check backend health dynamically
    const base = API_BASE_URL.replace(/\/+$/, "");
    fetch(`${base}/health`)
      .then((r) => r.json())
      .then((data) => {
        if (data && data.llm_mode) {
          const m = String(data.llm_mode).toLowerCase();
          if (m.includes("groq")) {
            setActiveLabel("Live Groq");
            setIsLive(true);
          } else if (m.includes("openrouter")) {
            setActiveLabel("Live OpenRouter");
            setIsLive(true);
          } else if (m.includes("grok")) {
            setActiveLabel("Live Grok");
            setIsLive(true);
          } else if (m.startsWith("live")) {
            setActiveLabel("Live LLM");
            setIsLive(true);
          } else {
            setActiveLabel("Simulation Mode");
            setIsLive(false);
          }
        }
      })
      .catch(() => {
        setActiveLabel("Simulation Mode");
        setIsLive(false);
      });
  }, [mode]);

  if (!activeLabel) return null;

  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
        </span>
        {activeLabel.includes("Groq") ? (
          <Zap className="size-3 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
        )}
        {activeLabel}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 font-mono text-[10px] font-medium text-amber-700 dark:text-amber-400">
      <Cpu className="size-3 text-amber-600 dark:text-amber-400" />
      {activeLabel}
    </span>
  );
}

