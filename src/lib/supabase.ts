import { createClient, type User, type Session } from "@supabase/supabase-js";
import type { Conversation, ChatMessage } from "./grounded.types";

const supabaseUrl = (import.meta.env["VITE_SUPABASE_URL"] as string) || "";
const supabaseAnonKey = (import.meta.env["VITE_SUPABASE_ANON_KEY"] as string) || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith("https://") &&
  !supabaseUrl.includes("your-project")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/* ── Database Helpers ────────────────────────────────────────────────────── */

export async function fetchCloudConversations(userId: string): Promise<Conversation[]> {
  if (!supabase || !userId) return [];

  try {
    // 1. Fetch conversations for user
    const { data: convosData, error: convosError } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (convosError || !convosData) {
      console.warn("[supabase] Failed to fetch conversations:", convosError);
      return [];
    }

    if (convosData.length === 0) return [];

    const convoIds = convosData.map((c) => c.id);

    // 2. Fetch all messages for these conversations
    const { data: msgsData, error: msgsError } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: true })
      .limit(2000);

    if (msgsError) {
      console.warn("[supabase] Failed to fetch messages:", msgsError);
    }

    const messagesByConvo: Record<string, ChatMessage[]> = {};
    (msgsData || []).forEach((m) => {
      const list = messagesByConvo[m.conversation_id] ?? [];
      list.push({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content || "",
        response: m.response || undefined,
        elapsedMs: m.elapsed_ms || undefined,
        timestamp: m.created_at ? new Date(m.created_at).getTime() : Date.now(),
      });
      messagesByConvo[m.conversation_id] = list;
    });

    return convosData.map((c) => {
      const msgs = (messagesByConvo[c.id] || []).sort((a, b) => a.timestamp - b.timestamp);
      return {
        id: c.id,
        title: c.title || "Consultation",
        messages: msgs,
        createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
        updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
      };
    });
  } catch (err) {
    console.error("[supabase] Error fetching cloud conversations:", err);
    return [];
  }
}

export async function syncConversationToCloud(
  convo: Conversation,
  userId: string
): Promise<void> {
  if (!supabase || !userId) return;

  try {
    // 1. Upsert conversation header
    const { error: convoError } = await supabase.from("conversations").upsert({
      id: convo.id,
      user_id: userId,
      title: convo.title,
      updated_at: new Date(convo.updatedAt || Date.now()).toISOString(),
    });

    if (convoError) {
      console.warn("[supabase] Error upserting conversation:", convoError);
      return;
    }

    // 2. Upsert messages
    if (convo.messages.length > 0) {
      const rows = convo.messages.map((m) => ({
        id: m.id,
        conversation_id: convo.id,
        role: m.role,
        content: m.content || m.response?.recommendation || "",
        response: m.response ? JSON.parse(JSON.stringify(m.response)) : null,
        elapsed_ms: m.elapsedMs || null,
        created_at: new Date(m.timestamp || Date.now()).toISOString(),
      }));

      const { error: msgsError } = await supabase
        .from("messages")
        .upsert(rows, { onConflict: "id" });

      if (msgsError) {
        console.warn("[supabase] Error upserting messages:", msgsError);
      }
    }
  } catch (err) {
    console.warn("[supabase] Error syncing conversation to cloud:", err);
  }
}

export async function deleteCloudConversation(
  convoId: string,
  userId: string
): Promise<void> {
  if (!supabase || !userId) return;

  try {
    await supabase
      .from("conversations")
      .delete()
      .eq("id", convoId)
      .eq("user_id", userId);
  } catch (err) {
    console.warn("[supabase] Error deleting conversation from cloud:", err);
  }
}
