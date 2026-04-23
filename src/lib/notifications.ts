import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type NotificationType = Database["public"]["Enums"]["notification_type"];

export type NotificationRow = {
  id: string;
  user_id: string;
  type: NotificationType;
  contract_id: string | null;
  execution_id: string | null;
  message: string;
  read: boolean;
  created_at: string;
};

type SendParams = {
  userId: string;
  type: NotificationType;
  message: string;
  contractId?: string | null;
  executionId?: string | null;
};

/**
 * Single entry point for creating in-app notifications.
 * Sets email_sent = false; when an email provider is wired in later,
 * only this function changes — no schema changes required.
 */
export const sendNotification = async (params: SendParams) => {
  const { error } = await supabase.from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    message: params.message,
    contract_id: params.contractId ?? null,
    execution_id: params.executionId ?? null,
    email_sent: false,
    email_sent_at: null,
  });
  if (error) {
    // Non-fatal — surface to console for debugging but don't break user flow.
    console.warn("[sendNotification] failed:", error.message);
  }
};

// Tiny event bus so the bell can refetch when new notifications are sent
// from anywhere in the app.
type Listener = () => void;
const listeners = new Set<Listener>();
export const notificationEvents = {
  emit: () => listeners.forEach((l) => l()),
  on: (l: Listener) => { listeners.add(l); return () => listeners.delete(l); },
};

/** SHA-256 over a string, lowercase hex. Used for settlement evidence fingerprints. */
export const sha256Hex = async (input: string): Promise<string> => {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
