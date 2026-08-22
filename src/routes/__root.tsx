import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Menu, X, MessageSquare, FlaskConical, Layers, LogIn } from "lucide-react";

import appCss from "../styles.css?url";
import { GroundedLogo } from "../components/grounded/GroundedLogo";
import { ModeBadge } from "../components/grounded/ModeBadge";
import { ThemeToggle } from "../components/grounded/ThemeToggle";
import { cn } from "../lib/utils";

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
  console.error("[Grounded Application Error]", error);
  const router = useRouter();

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
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=5" },
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
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/icon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-full">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChat = pathname === "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      {isChat ? (
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <Outlet />
        </div>
      ) : (
        <div className="flex min-h-screen w-full flex-col bg-background">
          <header className="sticky top-0 z-30 border-b border-border bg-paper/90 backdrop-blur-md">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5">
              {/* Brand Logo & Title */}
              <Link to="/" className="flex items-center gap-2.5 min-w-0">
                <GroundedLogo className="size-7 shrink-0 text-evidence" />
                <div className="flex flex-col min-w-0">
                  <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-foreground truncate">
                    Grounded
                  </span>
                  <span className="label-mono text-muted-foreground text-[9px] sm:text-[10px] hidden sm:inline truncate">
                    USPSTF · clinical evidence counseling
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Items */}
              <div className="hidden md:flex items-center gap-3">
                <ModeBadge />
                <nav className="flex items-center gap-1 border-l border-border pl-3">
                  <Link
                    to="/"
                    className="label-mono rounded-[4px] px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
                    activeProps={{ className: "text-evidence bg-evidence-soft font-medium" }}
                    activeOptions={{ exact: true }}
                  >
                    Chat
                  </Link>
                  <Link
                    to="/demo"
                    className="label-mono rounded-[4px] px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
                    activeProps={{ className: "text-evidence bg-evidence-soft font-medium" }}
                  >
                    Demo
                  </Link>
                  <Link
                    to="/how-it-works"
                    className="label-mono rounded-[4px] px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
                    activeProps={{ className: "text-evidence bg-evidence-soft font-medium" }}
                  >
                    Architecture
                  </Link>
                  <Link
                    to="/auth"
                    className="label-mono rounded-[4px] px-3 py-1.5 text-evidence transition-colors hover:bg-evidence/10"
                    activeProps={{ className: "bg-evidence/15 font-semibold" }}
                  >
                    Sign In
                  </Link>
                </nav>
                <ThemeToggle />
              </div>

              {/* Mobile Top Actions & Hamburger Menu */}
              <div className="flex md:hidden items-center gap-2">
                <ModeBadge />
                <ThemeToggle />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation Drawer / Dropdown */}
            {mobileMenuOpen && (
              <div className="border-t border-border bg-card/95 px-4 py-4 backdrop-blur-md md:hidden animate-fade-up">
                <nav className="flex flex-col space-y-1">
                  <Link
                    to="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                    activeProps={{ className: "bg-evidence/10 text-evidence font-semibold" }}
                    activeOptions={{ exact: true }}
                  >
                    <MessageSquare className="size-4" />
                    <span>Chat Assistant</span>
                  </Link>

                  <Link
                    to="/demo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                    activeProps={{ className: "bg-evidence/10 text-evidence font-semibold" }}
                  >
                    <FlaskConical className="size-4" />
                    <span>Demo Scenarios</span>
                  </Link>

                  <Link
                    to="/how-it-works"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
                    activeProps={{ className: "bg-evidence/10 text-evidence font-semibold" }}
                  >
                    <Layers className="size-4" />
                    <span>Pipeline Architecture</span>
                  </Link>

                  <div className="my-2 border-t border-border/50" />

                  <Link
                    to="/auth"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-evidence/15 px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-evidence hover:bg-evidence/25 transition-colors"
                  >
                    <LogIn className="size-4" />
                    <span>Sign In / Create Account</span>
                  </Link>
                </nav>
              </div>
            )}
          </header>

          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
            <Outlet />
          </main>

          <footer className="border-t border-border bg-paper">
            <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="label-mono mr-2 text-foreground/70">Disclaimer</span>
                This tool supports, and does not replace, clinical judgment. Answers
                are limited to the indexed USPSTF guideline text and are not
                diagnosis or personalized medical advice.
              </p>
            </div>
          </footer>
        </div>
      )}
    </QueryClientProvider>
  );
}
