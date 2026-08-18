import { createFileRoute } from "@tanstack/react-router";
import { AskConsole, useAskController } from "@/components/grounded/AskConsole";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Grounded — Evidence-Bound Skin Cancer Counseling Assistant" },
      {
        name: "description",
        content:
          "Ask skin cancer prevention counseling questions and get answers bound to traceable USPSTF citations, with visible retrieval, confidence and refusal logic.",
      },
      {
        property: "og:title",
        content: "Grounded — Evidence-Bound Clinical Assistant",
      },
      {
        property: "og:description",
        content:
          "Every claim carries a verifiable citation. Refusal and uncertainty are first-class outcomes.",
      },
    ],
  }),
  component: AskPage,
});

const EXAMPLES = [
  "What does the USPSTF recommend for adults older than 24 with fair skin?",
  "Are there harms associated with sun-protection counseling?",
  "Should patients be counseled on skin self-examination?",
];

function AskPage() {
  const controller = useAskController();

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <p className="label-mono text-evidence">
          Evidence-bound retrieval · fluent ≠ safe
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">
          Nothing is asserted here without a traceable citation.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Grounded answers skin cancer prevention counseling questions strictly
          from the USPSTF behavioral counseling guideline. It shows the chunks it
          retrieved, the confidence threshold it applied, and refuses when the
          source does not cover your question.
        </p>
      </header>

      <AskConsole controller={controller} />

      {controller.stage < 0 && (
        <section className="max-w-3xl">
          <div className="label-mono mb-3 text-muted-foreground">
            Example in-scope queries
          </div>
          <ul className="flex flex-wrap gap-2">
            {EXAMPLES.map((e) => (
              <li key={e}>
                <button
                  onClick={() => controller.submit(e)}
                  className="rounded-[4px] border border-border bg-card px-3 py-2 text-left text-[13px] text-foreground/80 transition-colors hover:border-evidence/50 hover:bg-evidence-soft"
                >
                  {e}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
