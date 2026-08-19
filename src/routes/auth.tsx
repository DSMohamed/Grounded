import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GroundedLogo } from "@/components/grounded/GroundedLogo";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { ArrowLeft, Lock, Mail, KeyRound, AlertCircle, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Authentication — Grounded Clinical Intelligence" },
      {
        name: "description",
        content: "Sign in or create an account to sync your evidence-bound consultations.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
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
  }, [router]);

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Top brand */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <GroundedLogo className="size-8 text-evidence" />
            <span className="font-serif text-2xl font-semibold tracking-tight text-foreground">
              Grounded
            </span>
          </Link>
          <p className="font-mono text-xs uppercase tracking-widest text-evidence">
            Clinical Evidence Intelligence
          </p>
          <h1 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            {tab === "signin" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "signin"
              ? "Sign in to access your cloud-synced consultations."
              : "Register to save and sync clinical query history across devices."}
          </p>
        </div>

        {/* Configuration notice if Supabase keys not set */}
        {!isSupabaseConfigured && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-left animate-fade-up">
            <div className="flex items-start gap-3">
              <Sparkles className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  Supabase Setup Ready
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                  To enable live cloud authentication, add your project credentials to <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-[11px]">.env</code>:
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
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-panel">
          {/* Tabs */}
          <div className="flex rounded-lg bg-muted/40 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab("signin");
                setErrorMsg(null);
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

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-evidence/30 bg-evidence/10 p-3 text-xs text-evidence">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="space-y-1">
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

            <div className="space-y-1">
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
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Processing…" : tab === "signin" ? "Sign In" : "Create Account"}
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
