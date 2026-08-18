import { createFileRoute } from "@tanstack/react-router";
import { AskConsole, useAskController } from "@/components/grounded/AskConsole";
import { DEMO_CASES } from "@/lib/grounded.types";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demo Mode — Grounded Clinical Evidence Assistant" },
      {
        name: "description",
        content:
          "Three one-click scenarios: a cited success, a multi-chunk synthesis, and a live refusal on an out-of-scope question.",
      },
      { property: "og:title", content: "Demo Mode — Grounded" },
      {
        property: "og:description",
        content:
          "Run the judge demo without typing: success, synthesis, and safe refusal, each a real live call.",
      },
    ],
  }),
  component: DemoPage,
});

function DemoPage() {
  const controller = useAskController();

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <p className="label-mono text-evidence">Demo mode</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight">
          Three scenarios, three real pipeline runs.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Each button issues a genuine request — no canned responses. The third
          case is expected to end in a refusal.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {DEMO_CASES.map((c) => (
          <button
            key={c.id}
            onClick={() => controller.submit(c.question)}
            className="group rounded-md border border-border bg-paper p-5 text-left shadow-panel transition-colors hover:border-evidence/50 hover:bg-evidence-soft"
          >
            <div className="label-mono text-evidence">{c.label}</div>
            <p className="mt-2 text-sm text-muted-foreground">{c.blurb}</p>
            <p className="mt-3 font-serif text-[15px] leading-snug">
              “{c.question}”
            </p>
          </button>
        ))}
      </div>

      <AskConsole controller={controller} showInput={false} />
    </div>
  );
}
