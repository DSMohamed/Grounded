import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Grounded — Evidence-Bound Clinical Assistant" },
      {
        name: "description",
        content:
          "An evidence-bound RAG assistant for skin cancer prevention counseling, grounded in the USPSTF guideline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=IBM+Plex+Mono:wght@400;500&family=Public+Sans:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <header className="border-b border-border bg-paper/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
            <Link to="/" className="flex items-baseline gap-2">
              <span className="font-serif text-xl tracking-tight">Grounded</span>
              <span className="label-mono text-muted-foreground">
                USPSTF · skin cancer prevention
              </span>
            </Link>
            <nav className="ml-auto flex items-center gap-1">
              <Link
                to="/"
                className="label-mono rounded-[3px] px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-evidence bg-evidence-soft" }}
                activeOptions={{ exact: true }}
              >
                Ask
              </Link>
              <Link
                to="/demo"
                className="label-mono rounded-[3px] px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-evidence bg-evidence-soft" }}
              >
                Demo mode
              </Link>
            </nav>
          </div>
        </header>

        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-12">
          <Outlet />
        </main>

        <footer className="border-t border-border bg-paper">
          <div className="mx-auto max-w-6xl px-6 py-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="label-mono mr-2 text-foreground/70">Disclaimer</span>
              This tool supports, and does not replace, clinical judgment. Answers
              are limited to the indexed USPSTF guideline text and are not
              diagnosis or personalized medical advice.
            </p>
          </div>
        </footer>
      </div>
    </QueryClientProvider>
  );
}

