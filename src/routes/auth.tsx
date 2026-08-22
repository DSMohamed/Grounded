import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GroundedLogo } from "@/components/grounded/GroundedLogo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  ArrowLeft,
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Authentication — Grounded Clinical Intelligence" },
      {
        name: "description",
        content: "Sign in or create an account with Google or email to sync your evidence-bound consultations.",
      },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="100%" height="100%">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.navigate({ to: "/" });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.navigate({ to: "/" });
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleAuth = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      return;
    }

    setGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err?.message || "Google authentication failed. Please try again.");
      setGoogleLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupabaseConfigured || !supabase) {
      setErrorMsg("Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (tab === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        router.navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
        });
        if (error) throw error;
        if (data.session) {
          router.navigate({ to: "/" });
        } else {
          setSuccessMsg("Account created! Check your email for the confirmation link or sign in.");
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full items-center justify-center py-4 sm:py-8 px-2 sm:px-4 animate-fade-up">
      <div className="w-full max-w-md space-y-6">
        {/* Top brand */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <GroundedLogo className="size-7 sm:size-8 text-evidence" />
            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Grounded
            </span>
          </Link>
          <p className="font-mono text-[10px] sm:text-xs uppercase tracking-widest text-evidence">
            Clinical Evidence Intelligence
          </p>
          <h1 className="mt-3 font-serif text-2xl sm:text-3xl font-semibold text-foreground">
            {tab === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground px-2">
            {tab === "signin"
              ? "Sign in to access your cloud-synced consultations."
              : "Register to save and sync clinical query history across devices."}
          </p>
        </div>

        {/* Configuration notice if Supabase keys not set */}
        {!isSupabaseConfigured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Supabase Setup Ready
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                  To enable live cloud & Google authentication, add your credentials to <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[11px]">.env</code>:
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-card/60 p-2 font-mono text-[10px] text-foreground/80">
                  VITE_SUPABASE_URL=https://your-project.supabase.co{"\n"}
                  VITE_SUPABASE_ANON_KEY=your-anon-key
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-7 shadow-panel">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted/40 p-1 mb-5">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={cn(
                "flex-1 rounded-md py-2 font-mono text-xs uppercase tracking-wider transition-all",
                tab === "signin"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={cn(
                "flex-1 rounded-md py-2 font-mono text-xs uppercase tracking-wider transition-all",
                tab === "signup"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-evidence/30 bg-evidence/10 p-3 text-xs text-evidence">
              <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Google Sign In / Sign Up Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background/80 py-2.5 px-4 font-sans text-sm font-medium text-foreground transition-all hover:bg-muted/40 hover:border-foreground/20 active:scale-[0.99] disabled:opacity-50 shadow-sm"
          >
            {googleLoading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <GoogleIcon className="size-4 shrink-0" />
            )}
            <span>
              {googleLoading
                ? "Connecting to Google…"
                : tab === "signin"
                  ? "Continue with Google"
                  : "Sign up with Google"}
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/70" />
            </div>
            <div className="relative bg-card px-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              or continue with email
            </div>
          </div>

          {/* Email & Password Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="label-mono text-[10px] text-muted-foreground block">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="clinician@hospital.org"
                  className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2.5 pl-9 text-sm outline-none transition-colors focus:border-evidence/60"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="label-mono text-[10px] text-muted-foreground block">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-border/60 bg-transparent px-3 py-2.5 pl-9 text-sm outline-none transition-colors focus:border-evidence/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 px-4 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Processing…</span>
                </>
              ) : tab === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Continue as Guest in Chat
          </Link>
        </div>
      </div>
    </div>
  );
}
