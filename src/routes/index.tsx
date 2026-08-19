import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ask } from "@/lib/grounded.functions";
import type { Conversation, ChatMessage as ChatMessageType, AskResponse } from "@/lib/grounded.types";
import { STARTER_PROMPTS } from "@/lib/grounded.types";
import { ChatSidebar } from "@/components/grounded/ChatSidebar";
import { ChatMessage } from "@/components/grounded/ChatMessage";
import { ChatInput } from "@/components/grounded/ChatInput";
import { GroundedLogo } from "@/components/grounded/GroundedLogo";
import { ModeBadge } from "@/components/grounded/ModeBadge";
import { ThemeToggle } from "@/components/grounded/ThemeToggle";
import { STAGES } from "@/components/grounded/StageTracker";
import {
  supabase,
  isSupabaseConfigured,
  fetchCloudConversations,
  syncConversationToCloud,
  deleteCloudConversation,
} from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Database, FileText, Cpu, PanelLeft, Cloud, EyeOff, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Grounded — Evidence-Bound Clinical AI Assistant" },
      {
        name: "description",
        content:
          "Ask skin cancer prevention counseling questions strictly bound to USPSTF guideline evidence.",
      },
      {
        property: "og:title",
        content: "Grounded — Evidence-Bound Clinical AI Assistant",
      },
    ],
  }),
  component: ChatIndexPage,
});

/* ── Isolated Storage Helpers ────────────────────────────────────────────── */

function getStorageKey(userId?: string | null): string {
  return userId ? `grounded_chat_user_${userId}` : `grounded_chat_guest_v1`;
}

function loadSavedConversations(userId?: string | null): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    // Clear old un-isolated legacy storage key if present
    if (localStorage.getItem("grounded_chat_conversations_v1")) {
      localStorage.removeItem("grounded_chat_conversations_v1");
    }

    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(convos.slice(0, 30)));
  } catch (e) {
    console.error("Failed to save conversations:", e);
  }
}

function ChatIndexPage() {
  const askFn = useServerFn(ask);
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunkCount, setChunkCount] = useState<number | null>(null);

  // Temporary chat state (in-memory only, never saved)
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [tempMessages, setTempMessages] = useState<ChatMessageType[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Supabase Auth state listener
  useEffect(() => {
    if (!supabase) return;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen to changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load conversations whenever user changes
  useEffect(() => {
    if (user && isSupabaseConfigured) {
      // Logged in: Fetch exclusively from Supabase Cloud
      fetchCloudConversations(user.id).then((cloudConvos) => {
        if (cloudConvos.length > 0) {
          setConversations(cloudConvos);
          if (cloudConvos[0]) setActiveId(cloudConvos[0].id);
        } else {
          // Check user-isolated local cache
          const userSaved = loadSavedConversations(user.id);
          setConversations(userSaved);
          if (userSaved.length > 0 && userSaved[0]) setActiveId(userSaved[0].id);
        }
      });
    } else {
      // Guest / Logged out: Load isolated guest conversations ONLY
      const guestSaved = loadSavedConversations(null);
      setConversations(guestSaved);
      setActiveId(guestSaved.length > 0 && guestSaved[0] ? guestSaved[0].id : null);
    }
  }, [user]);

  // 3. Fetch backend chunk count & status
  useEffect(() => {
    fetch(`${API_BASE_URL}/health`)
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.chunk_count === "number") setChunkCount(d.chunk_count);
      })
      .catch(() => {});
  }, []);

  const activeConversation = isTemporaryChat
    ? null
    : conversations.find((c) => c.id === activeId) || null;

  const currentDisplayMessages: ChatMessageType[] = isTemporaryChat
    ? tempMessages
    : activeConversation?.messages || [];

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentDisplayMessages.length]);

  const handleNewChat = useCallback(() => {
    if (isTemporaryChat) {
      setTempMessages([]);
    } else {
      setActiveId(null);
    }
  }, [isTemporaryChat]);

  const handleToggleTemporaryChat = useCallback(() => {
    setIsTemporaryChat((prev) => {
      const next = !prev;
      if (next) {
        // Reset temp messages on activating temporary chat
        setTempMessages([]);
      }
      return next;
    });
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated, user?.id);
      return updated;
    });

    if (user && isSupabaseConfigured) {
      deleteCloudConversation(id, user.id);
    }

    setActiveId((curr) => (curr === id ? null : curr));
  }, [user]);

  const handleSignOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      // Immediately reset conversations to isolated guest storage
      const guestSaved = loadSavedConversations(null);
      setConversations(guestSaved);
      setActiveId(guestSaved[0]?.id ?? null);
    }
  }, []);

  const handleSubmit = useCallback(
    async (queryText: string) => {
      const q = queryText.trim();
      if (!q || isProcessing) return;

      setIsProcessing(true);
      const userMsgId = `user_${Date.now()}`;
      const asstMsgId = `asst_${Date.now()}`;
      const startTime = performance.now();

      const userMsg: ChatMessageType = {
        id: userMsgId,
        role: "user",
        content: q,
        timestamp: Date.now(),
      };

      const initialAsstMsg: ChatMessageType = {
        id: asstMsgId,
        role: "assistant",
        content: "",
        stage: 0,
        elapsedMs: 0,
        timestamp: Date.now(),
      };

      // ── Scenario A: Temporary Chat (No DB / No LocalStorage) ───────────────────
      if (isTemporaryChat) {
        setTempMessages((prev) => [...prev, userMsg, initialAsstMsg]);

        const tempInterval = setInterval(() => {
          const elapsed = Math.round(performance.now() - startTime);
          setTempMessages((prev) =>
            prev.map((m) => (m.id === asstMsgId ? { ...m, elapsedMs: elapsed } : m))
          );
        }, 50);

        const tempStageTimeouts = [1, 2, 3].map((s, i) =>
          setTimeout(() => {
            setTempMessages((prev) =>
              prev.map((m) => (m.id === asstMsgId ? { ...m, stage: s } : m))
            );
          }, 250 * (i + 1))
        );

        try {
          let res: AskResponse | null = null;
          try {
            const apiRes = await fetch(`${API_BASE_URL}/ask`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ question: q }),
              signal: AbortSignal.timeout(30000),
            });
            if (apiRes.ok) res = (await apiRes.json()) as AskResponse;
          } catch {}

          if (!res) res = await askFn({ data: { question: q } });

          clearInterval(tempInterval);
          tempStageTimeouts.forEach(clearTimeout);
          const finalElapsed = Math.round(performance.now() - startTime);

          setTempMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId
                ? {
                    ...m,
                    stage: STAGES.length,
                    elapsedMs: finalElapsed,
                    response: res ?? undefined,
                    content: res?.recommendation || "Unable to generate answer.",
                  }
                : m
            )
          );
        } catch {
          clearInterval(tempInterval);
          tempStageTimeouts.forEach(clearTimeout);
          setTempMessages((prev) =>
            prev.map((m) =>
              m.id === asstMsgId
                ? {
                    ...m,
                    stage: -1,
                    elapsedMs: Math.round(performance.now() - startTime),
                    content: "The evidence service encountered an error processing this query.",
                  }
                : m
            )
          );
        } finally {
          setIsProcessing(false);
        }
        return;
      }

      // ── Scenario B: Standard Chat (Persisted to Cloud or Isolated Local) ───────
      let currentConvoId = activeId;
      let targetConvo: Conversation;

      if (!currentConvoId) {
        const newId = `convo_${Date.now()}`;
        currentConvoId = newId;
        const title = q.length > 45 ? `${q.slice(0, 42)}...` : q;
        targetConvo = {
          id: newId,
          title,
          messages: [userMsg, initialAsstMsg],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setConversations((prev) => {
          const next = [targetConvo, ...prev];
          saveConversations(next, user?.id);
          return next;
        });
        setActiveId(newId);
      } else {
        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id === currentConvoId) {
              return {
                ...c,
                messages: [...c.messages, userMsg, initialAsstMsg],
                updatedAt: Date.now(),
              };
            }
            return c;
          });
          saveConversations(next, user?.id);
          return next;
        });
      }

      const interval = setInterval(() => {
        const elapsed = Math.round(performance.now() - startTime);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === currentConvoId) {
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === asstMsgId ? { ...m, elapsedMs: elapsed } : m
                ),
              };
            }
            return c;
          })
        );
      }, 50);

      const stageTimeouts = [1, 2, 3].map((s, i) =>
        setTimeout(() => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === currentConvoId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === asstMsgId ? { ...m, stage: s } : m
                  ),
                };
              }
              return c;
            })
          );
        }, 250 * (i + 1))
      );

      try {
        let res: AskResponse | null = null;
        try {
          const apiRes = await fetch(`${API_BASE_URL}/ask`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q }),
            signal: AbortSignal.timeout(30000),
          });
          if (apiRes.ok) res = (await apiRes.json()) as AskResponse;
        } catch {}

        if (!res) res = await askFn({ data: { question: q } });

        clearInterval(interval);
        stageTimeouts.forEach(clearTimeout);
        const finalElapsed = Math.round(performance.now() - startTime);

        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id === currentConvoId) {
              const updatedConvo: Conversation = {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === asstMsgId) {
                    return {
                      ...m,
                      stage: STAGES.length,
                      elapsedMs: finalElapsed,
                      response: res ?? undefined,
                      content: res?.recommendation || "Unable to generate answer.",
                    };
                  }
                  return m;
                }),
                updatedAt: Date.now(),
              };

              // Sync to Supabase cloud if user is logged in
              if (user && isSupabaseConfigured) {
                syncConversationToCloud(updatedConvo, user.id);
              }

              return updatedConvo;
            }
            return c;
          });
          saveConversations(next, user?.id);
          return next;
        });
      } catch {
        clearInterval(interval);
        stageTimeouts.forEach(clearTimeout);
        const finalElapsed = Math.round(performance.now() - startTime);

        setConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id === currentConvoId) {
              return {
                ...c,
                messages: c.messages.map((m) => {
                  if (m.id === asstMsgId) {
                    return {
                      ...m,
                      stage: -1,
                      elapsedMs: finalElapsed,
                      content: "The evidence service encountered an error processing this query.",
                    };
                  }
                  return m;
                }),
                updatedAt: Date.now(),
              };
            }
            return c;
          });
          saveConversations(next, user?.id);
          return next;
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [activeId, isProcessing, askFn, user, isTemporaryChat]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* ChatGPT-style Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        user={user}
        isTemporaryChat={isTemporaryChat}
        onNew={handleNewChat}
        onSelect={(id) => {
          setIsTemporaryChat(false);
          setActiveId(id);
        }}
        onDelete={handleDeleteChat}
        onSignOut={handleSignOut}
        onToggleTemporaryChat={handleToggleTemporaryChat}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Chat Interface */}
      <main className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border/40 bg-card/20 px-3 sm:px-4 backdrop-blur">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex md:hidden size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground shrink-0"
              aria-label="Open sidebar menu"
            >
              <PanelLeft className="size-4" />
            </button>

            {/* Desktop toggle button */}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="hidden md:flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground shrink-0"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="size-4" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className="font-serif text-xs sm:text-sm font-semibold text-foreground truncate">
                {isTemporaryChat
                  ? "Temporary Consultation"
                  : activeConversation
                    ? activeConversation.title
                    : "New Consultation"}
              </span>
              <span className="label-mono text-[10px] text-muted-foreground/60 hidden lg:inline whitespace-nowrap">
                · USPSTF guideline bound
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isTemporaryChat ? (
              <span className="inline-flex items-center gap-1 font-mono text-[9px] sm:text-[10px] text-amber-700 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5 sm:px-2.5 sm:py-1 font-medium">
                <EyeOff className="size-2.5 sm:size-3" /> Temp
              </span>
            ) : (
              user && (
                <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] text-evidence bg-evidence/10 border border-evidence/20 rounded-full px-2.5 py-1">
                  <Cloud className="size-3" /> Cloud Synced
                </span>
              )
            )}
            <ModeBadge />
            <div className="hidden sm:flex items-center gap-1 border-l border-border/40 pl-3">
              <Link
                to="/demo"
                className="label-mono rounded-[4px] px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
              >
                Demo Cases
              </Link>
              <Link
                to="/how-it-works"
                className="label-mono rounded-[4px] px-2.5 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
              >
                Architecture
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Temporary Chat Notice Banner */}
        {isTemporaryChat && (
          <div className="flex items-center justify-between border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <EyeOff className="size-4 shrink-0" />
              <span>
                <strong>Temporary Chat Active:</strong> Messages won't appear in history, won't be saved to the database, and will disappear on refresh.
              </span>
            </div>
            <button
              onClick={() => setIsTemporaryChat(false)}
              className="ml-2 font-mono text-[10px] uppercase tracking-wider text-amber-900 dark:text-amber-200 underline hover:no-underline"
            >
              Exit
            </button>
          </div>
        )}

        {/* Chat message stream or Empty State */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {currentDisplayMessages.length === 0 ? (
            /* Empty State: ChatGPT Hero + Starter Prompts */
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-evidence/15 border border-evidence/30 shadow-lg mb-6">
                <GroundedLogo className="size-8 text-evidence" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                {isTemporaryChat ? "Temporary Consultation" : "Grounded Clinical Intelligence"}
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                {isTemporaryChat
                  ? "This consultation is private and ephemeral. It will not be stored in your history or saved to the cloud."
                  : "Ask behavioral counseling and prevention questions strictly bound to verified USPSTF guideline evidence. Every claim carries an inspectable citation."}
              </p>

              {/* Document scope badges */}
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] text-muted-foreground shadow-sm">
                  <FileText className="size-3 text-evidence" />
                  USPSTF Skin Cancer Counseling
                </span>
                {chunkCount !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-evidence/20 bg-evidence/10 px-3 py-1 font-mono text-[11px] text-evidence">
                    <Database className="size-3" />
                    {chunkCount} chunks indexed
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] text-muted-foreground shadow-sm">
                  <Cpu className="size-3" />
                  bge-small-en-v1.5 · ChromaDB
                </span>
              </div>

              {/* Starter Prompts Grid */}
              <div className="mt-10 grid w-full max-w-2xl grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => handleSubmit(p.question)}
                    disabled={isProcessing}
                    className="group flex flex-col items-start rounded-xl border border-border/60 bg-card/50 p-4 text-left shadow-sm transition-all hover:border-evidence/40 hover:bg-evidence/5 hover:shadow-md"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-evidence">
                        {p.label}
                      </span>
                    </div>
                    <p className="mt-2 text-[13px] leading-snug text-foreground/80 group-hover:text-foreground">
                      "{p.question}"
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Active Conversation Messages */
            <div className="mx-auto max-w-3xl space-y-6">
              {currentDisplayMessages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <ChatInput onSubmit={handleSubmit} disabled={isProcessing} />
      </main>
    </div>
  );
}
