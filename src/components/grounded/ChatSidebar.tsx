import { Plus, MessageSquare, Trash2, LogIn, LogOut, User as UserIcon, Cloud, EyeOff } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Conversation } from "@/lib/grounded.types";
import { GroundedLogo } from "./GroundedLogo";
import { ThemeToggle } from "./ThemeToggle";
import { ModeBadge } from "./ModeBadge";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

interface ChatSidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  user?: User | null;
  isTemporaryChat?: boolean;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onSignOut?: () => void;
  onToggleTemporaryChat?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function ChatSidebar({
  conversations,
  activeId,
  user,
  isTemporaryChat,
  onNew,
  onSelect,
  onDelete,
  onSignOut,
  onToggleTemporaryChat,
  collapsed,
  onToggle,
}: ChatSidebarProps) {
  // Group conversations by time
  const now = Date.now();
  const dayMs = 86400000;
  const today = conversations.filter((c) => now - c.updatedAt < dayMs);
  const week = conversations.filter((c) => now - c.updatedAt >= dayMs && now - c.updatedAt < 7 * dayMs);
  const older = conversations.filter((c) => now - c.updatedAt >= 7 * dayMs);

  if (collapsed) {
    return (
      <aside className="flex w-16 flex-col items-center border-r border-border/40 bg-[var(--sidebar-bg)] py-4">
        <button
          onClick={onToggle}
          className="mb-4 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/20 hover:text-foreground"
        >
          <MessageSquare className="size-5" />
        </button>
        <button
          onClick={onNew}
          title="New conversation"
          className="mb-2 flex size-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-evidence/10 hover:text-evidence"
        >
          <Plus className="size-5" />
        </button>
        <button
          onClick={onToggleTemporaryChat}
          title="Temporary Chat"
          className={cn(
            "flex size-10 items-center justify-center rounded-lg transition-colors",
            isTemporaryChat
              ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
              : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          )}
        >
          <EyeOff className="size-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border/40 bg-[var(--sidebar-bg)]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-4 py-3.5">
        <GroundedLogo className="size-5 text-evidence" />
        <span className="font-serif text-sm font-semibold text-foreground tracking-tight">
          Grounded
        </span>
        <button
          onClick={onToggle}
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          aria-label="Collapse sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="space-y-1.5 px-3 py-3">
        <button
          onClick={onNew}
          className="flex w-full items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-2 font-mono text-[12px] text-muted-foreground transition-colors hover:bg-evidence/10 hover:text-evidence hover:border-evidence/30"
        >
          <Plus className="size-4" />
          New conversation
        </button>

        <button
          onClick={onToggleTemporaryChat}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] uppercase tracking-wider transition-all",
            isTemporaryChat
              ? "border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold"
              : "border-border/30 bg-card/20 text-muted-foreground hover:bg-muted/20 hover:text-foreground"
          )}
        >
          <EyeOff className="size-3.5" />
          {isTemporaryChat ? "Temporary Active" : "Temporary Chat"}
        </button>
      </div>

      {/* Conversation list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {today.length > 0 && (
          <ConvoGroup label="Today" items={today} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        )}
        {week.length > 0 && (
          <ConvoGroup label="Previous 7 days" items={week} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        )}
        {older.length > 0 && (
          <ConvoGroup label="Older" items={older} activeId={activeId} onSelect={onSelect} onDelete={onDelete} />
        )}
        {conversations.length === 0 && (
          <p className="px-3 py-6 text-center text-[12px] text-muted-foreground/40">
            No conversations yet
          </p>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/30 px-3 py-3 space-y-2.5">
        {/* User profile / Auth button */}
        {user ? (
          <div className="flex items-center justify-between rounded-lg bg-card/50 border border-border/40 p-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-evidence/20 font-mono text-xs font-semibold text-evidence">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {user.email}
                </p>
                <span className="flex items-center gap-1 font-mono text-[9px] text-evidence">
                  <Cloud className="size-2.5" /> Synced
                </span>
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/auth"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-evidence/30 bg-evidence/10 px-3 py-2 font-mono text-[11px] uppercase tracking-wider text-evidence transition-all hover:bg-evidence/20"
          >
            <LogIn className="size-3.5" />
            Sign In / Cloud Sync
          </Link>
        )}

        <ModeBadge />

        <div className="flex items-center gap-2">
          <nav className="flex items-center gap-1">
            <Link
              to="/demo"
              className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
            >
              Demo
            </Link>
            <Link
              to="/how-it-works"
              className="rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/20"
            >
              Architecture
            </Link>
          </nav>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ── Conversation group ────────────────────────────────────────────────── */

function ConvoGroup({
  label,
  items,
  activeId,
  onSelect,
  onDelete,
}: {
  label: string;
  items: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="mb-3">
      <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground/50">
        {label}
      </p>
      {items.map((c) => (
        <div
          key={c.id}
          className={cn(
            "group relative flex items-center rounded-lg px-3 py-2 transition-colors cursor-pointer",
            c.id === activeId
              ? "bg-evidence/10 text-foreground"
              : "text-muted-foreground hover:bg-muted/15 hover:text-foreground",
          )}
          onClick={() => onSelect(c.id)}
        >
          <MessageSquare className="mr-2.5 size-3.5 shrink-0 opacity-50" />
          <span className="truncate text-[13px]">{c.title}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(c.id);
            }}
            className="absolute right-2 flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete conversation"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
