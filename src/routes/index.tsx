import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ask } from "@/lib/grounded.functions";
import type { Conversation, ChatMessage as ChatMessageType, AskResponse } from "@/lib/grounded.types";
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

function getActiveIdKey(userId?: string | null): string {
  return userId ? `grounded_active_id_${userId}` : `grounded_active_id_guest`;
}

function loadActiveId(userId?: string | null): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(getActiveIdKey(userId));
  } catch {
    return null;
  }
}

function saveActiveId(id: string | null, userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = getActiveIdKey(userId);
    if (id) localStorage.setItem(key, id);
    else localStorage.removeItem(key);
  } catch (e) {
    console.error("Failed to save active id:", e);
  }
}

function loadSavedConversations(userId?: string | null): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    if (localStorage.getItem("grounded_chat_conversations_v1")) {
      localStorage.removeItem("grounded_chat_conversations_v1");
    }

    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c: any) => ({
      id: String(c.id),
      title: String(c.title || "Consultation"),
      createdAt: typeof c.createdAt === "number" && !isNaN(c.createdAt)
        ? c.createdAt
        : new Date(c.createdAt || Date.now()).getTime(),
      updatedAt: typeof c.updatedAt === "number" && !isNaN(c.updatedAt)
        ? c.updatedAt
        : new Date(c.updatedAt || c.createdAt || Date.now()).getTime(),
      messages: Array.isArray(c.messages)
        ? c.messages.map((m: any) => ({
            id: String(m.id),
            role: m.role as "user" | "assistant",
            content: String(m.content || ""),
            response: m.response || undefined,
            elapsedMs: typeof m.elapsedMs === "number" ? m.elapsedMs : undefined,
            stage: typeof m.stage === "number" ? m.stage : undefined,
            timestamp: typeof m.timestamp === "number" && !isNaN(m.timestamp)
              ? m.timestamp
              : new Date(m.timestamp || m.created_at || Date.now()).getTime(),
          }))
        : [],
    }));
  } catch {
    return [];
  }
}

function mergeConversations(local: Conversation[], cloud: Conversation[]): Conversation[] {
  const map = new Map<string, Conversation>();

  // Add all local conversations
  for (const c of local) {
    if (c && c.id) {
      map.set(c.id, {
        ...c,
        messages: Array.isArray(c.messages) ? [...c.messages] : [],
      });
    }
  }

  // Merge with cloud conversations
  for (const c of cloud) {
    if (!c || !c.id) continue;
    const existing = map.get(c.id);

    if (!existing) {
      map.set(c.id, {
        ...c,
        messages: Array.isArray(c.messages) ? [...c.messages] : [],
      });
    } else {
      // Merge messages by unique id
      const msgMap = new Map<string, ChatMessageType>();
      for (const m of existing.messages) {
        if (m && m.id) msgMap.set(m.id, m);
      }
      for (const m of (c.messages || [])) {
        if (m && m.id) {
          const curr = msgMap.get(m.id);
          // Prefer message with full response if available
          if (!curr || (m.response && !curr.response)) {
            msgMap.set(m.id, m);
          }
        }
      }
      const mergedMsgs = Array.from(msgMap.values()).sort(
        (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
      );

      map.set(c.id, {
        ...existing,
        title: existing.title || c.title,
        updatedAt: Math.max(existing.updatedAt, c.updatedAt),
        messages: mergedMsgs,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

function saveConversations(convos: Conversation[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    const key = getStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(convos.slice(0, 50)));
  } catch (e) {
    console.error("Failed to save conversations:", e);
  }
}

function ChatIndexPage() {
  const askFn = useServerFn(ask);
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    loadSavedConversations(null)
  );
  const [activeId, setActiveId] = useState<string | null>(() =>
    loadActiveId(null)
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunkCount, setChunkCount] = useState<number | null>(null);

  // Temporary chat state (in-memory only, never saved)
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [tempMessages, setTempMessages] = useState<ChatMessageType[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserIdRef = useRef<string | null | undefined>(undefined);
  const activeIdRef = useRef<string | null>(activeId);

  // Keep activeIdRef in sync
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // 1. Supabase Auth state listener
  useEffect(() => {
    if (!supabase) return;

    // Clean URL hash if returning from OAuth redirect
    if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
      window.history.replaceState(null, "", window.location.pathname);
    }

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen to changes (sign in, sign out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session && typeof window !== "undefined" && window.location.hash.includes("access_token")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Load and merge conversations when user ID changes
  useEffect(() => {
    const uid = user?.id ?? null;
    if (currentUserIdRef.current === uid) return;
    currentUserIdRef.current = uid;

    if (user && isSupabaseConfigured) {
      const localSaved = loadSavedConversations(user.id);
      if (localSaved.length > 0) {
        setConversations(localSaved);
      }

      fetchCloudConversations(user.id).then((cloudConvos) => {
        const merged = mergeConversations(localSaved, cloudConvos);
        setConversations(merged);
        saveConversations(merged, user.id);

        // Sync any local conversations to cloud that weren't synced yet
        merged.forEach((c) => syncConversationToCloud(c, user.id));

        const savedActive = loadActiveId(user.id);
        const matched = merged.find((c) => c.id === savedActive);
        const nextActive = matched ? matched.id : (merged[0]?.id ?? null);
        setActiveId(nextActive);
        saveActiveId(nextActive, user.id);
      });
    } else {
      const guestSaved = loadSavedConversations(null);
      setConversations(guestSaved);
      const savedActive = loadActiveId(null);
      const matched = guestSaved.find((c) => c.id === savedActive);
      const nextActive = matched ? matched.id : (guestSaved[0]?.id ?? null);
      setActiveId(nextActive);
      saveActiveId(nextActive, null);
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
      activeIdRef.current = null;
      setActiveId(null);
      saveActiveId(null, user?.id);
    }
  }, [isTemporaryChat, user]);

  const handleToggleTemporaryChat = useCallback(() => {
    setIsTemporaryChat((prev) => {
      const next = !prev;
      if (next) {
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

    setActiveId((curr) => {
      const nextId = curr === id ? null : curr;
      activeIdRef.current = nextId;
      saveActiveId(nextId, user?.id);
      return nextId;
    });
  }, [user]);

  const handleSignOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      const guestSaved = loadSavedConversations(null);
      setConversations(guestSaved);
      const nextActive = guestSaved[0]?.id ?? null;
      activeIdRef.current = nextActive;
      setActiveId(nextActive);
      saveActiveId(nextActive, null);
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
      let currentConvoId = activeIdRef.current;
      let targetConvo: Conversation;

      if (!currentConvoId) {
        const newId = `convo_${Date.now()}`;
        currentConvoId = newId;
        activeIdRef.current = newId;
        const title = q.length > 45 ? `${q.slice(0, 42)}...` : q;
        targetConvo = {
          id: newId,
          title,
          messages: [userMsg, initialAsstMsg],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        setConversations((prev) => {
          const next = [targetConvo, ...prev.filter((c) => c.id !== newId)];
          saveConversations(next, user?.id);
          return next;
        });
        setActiveId(newId);
        saveActiveId(newId, user?.id);
      } else {
        setConversations((prev) => {
          const existing = prev.find((c) => c.id === currentConvoId);
          if (existing) {
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
          } else {
            const title = q.length > 45 ? `${q.slice(0, 42)}...` : q;
            const newConvo: Conversation = {
              id: currentConvoId,
              title,
              messages: [userMsg, initialAsstMsg],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            const next = [newConvo, ...prev];
            saveConversations(next, user?.id);
            return next;
          }
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
    [isProcessing, askFn, user, isTemporaryChat]
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
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
          saveActiveId(id, user?.id);
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
            /* Empty State: Professional Hero */
            <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center px-4 animate-fade-up">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-evidence/10 border border-evidence/25 shadow-sm mb-5">
                <GroundedLogo className="size-7 text-evidence" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                {isTemporaryChat ? "Temporary Consultation" : "Grounded Clinical Intelligence"}
              </h1>
              <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
                {isTemporaryChat
                  ? "This consultation is private and ephemeral. It will not be stored in your history or saved to the cloud."
                  : "Evidence-bound clinical counseling assistant strictly grounded in the USPSTF guideline with inspectable citations."}
              </p>

              {/* Document scope badges */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] text-muted-foreground shadow-xs">
                  <FileText className="size-3 text-evidence" />
                  USPSTF Skin Cancer Counseling
                </span>
                {chunkCount !== null && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-evidence/20 bg-evidence/10 px-3 py-1 font-mono text-[11px] text-evidence">
                    <Database className="size-3" />
                    {chunkCount} chunks indexed
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card/60 px-3 py-1 font-mono text-[11px] text-muted-foreground shadow-xs">
                  <Cpu className="size-3" />
                  bge-small-en-v1.5 · ChromaDB
                </span>
              </div>
            </div>
          ) : (
            /* Active Conversation Messages */
            <div className="mx-auto max-w-3xl space-y-6">
              {(() => {
                let runningTokens = 0;
                const SESSION_BUDGET = 8192;

                return currentDisplayMessages.map((m) => {
                  const thisTokens =
                    m.role === "assistant"
                      ? (m.response?.token_usage?.total_tokens ??
                        (m.response ? Math.max(100, Math.floor((m.response.recommendation?.length || 60) * 1.3)) : 0))
                      : Math.max(8, Math.floor(m.content.split(/\s+/).filter(Boolean).length * 1.3));

                  runningTokens += thisTokens;
                  const cumulative = runningTokens;
                  const remaining = Math.max(0, SESSION_BUDGET - cumulative);

                  return (
                    <ChatMessage
                      key={m.id}
                      message={m}
                      cumulativeTokens={cumulative}
                      remainingBudget={remaining}
                      sessionBudget={SESSION_BUDGET}
                    />
                  );
                });
              })()}
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
