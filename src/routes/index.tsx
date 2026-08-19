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
import { Database, FileText, Cpu, PanelLeft, Sparkles } from "lucide-react";

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

const STORAGE_KEY = "grounded_chat_conversations_v1";

function loadSavedConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(convos.slice(0, 30)));
  } catch (e) {
    console.error("Failed to save conversations:", e);
  }
}

function ChatIndexPage() {
  const askFn = useServerFn(ask);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chunkCount, setChunkCount] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    const saved = loadSavedConversations();
    setConversations(saved);
    if (saved.length > 0 && saved[0]) {
      setActiveId(saved[0].id);
    }
  }, []);

  // Fetch backend chunk count & status
  useEffect(() => {
    fetch("http://127.0.0.1:8000/health")
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.chunk_count === "number") setChunkCount(d.chunk_count);
      })
      .catch(() => {});
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, activeConversation?.messages?.length]);

  const handleNewChat = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveConversations(updated);
      return updated;
    });
    setActiveId((curr) => (curr === id ? null : curr));
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

      let currentConvoId = activeId;
      let targetConvo: Conversation;

      if (!currentConvoId) {
        // Create new conversation
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
          saveConversations(next);
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
          saveConversations(next);
          return next;
        });
      }

      // Timer & stage progression
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
          const apiRes = await fetch("http://127.0.0.1:8000/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: q }),
            signal: AbortSignal.timeout(30000),
          });
          if (apiRes.ok) {
            res = (await apiRes.json()) as AskResponse;
          }
        } catch {
          // fallback to SSR server function
        }

        if (!res) {
          res = await askFn({ data: { question: q } });
        }

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
            }
            return c;
          });
          saveConversations(next);
          return next;
        });
      } catch (err) {
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
          saveConversations(next);
          return next;
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [activeId, isProcessing, askFn]
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* ChatGPT-style Sidebar */}
      <ChatSidebar
        conversations={conversations}
        activeId={activeId}
        onNew={handleNewChat}
        onSelect={(id) => setActiveId(id)}
        onDelete={handleDeleteChat}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Chat Interface */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border/40 bg-card/20 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                aria-label="Expand sidebar"
              >
                <PanelLeft className="size-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="font-serif text-sm font-semibold text-foreground">
                {activeConversation ? activeConversation.title : "New Consultation"}
              </span>
              <span className="label-mono text-[10px] text-muted-foreground/60 hidden sm:inline">
                · USPSTF guideline bound
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        {/* Chat message stream or Empty State */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            /* Empty State: ChatGPT Hero + Starter Prompts */
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-evidence/15 border border-evidence/30 shadow-lg mb-6">
                <GroundedLogo className="size-8 text-evidence" />
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                Grounded Clinical Intelligence
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                Ask behavioral counseling and prevention questions strictly bound to verified USPSTF guideline evidence. Every claim carries an inspectable citation.
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

              {/* Starter Prompts Grid (ChatGPT style) */}
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
              {activeConversation.messages.map((m) => (
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
