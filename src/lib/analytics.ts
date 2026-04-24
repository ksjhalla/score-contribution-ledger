import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "score_session";

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "no-session";
  }
}

export const trackEvent = async (
  eventName: string,
  properties?: Record<string, unknown>
): Promise<void> => {
  try {
    await supabase.from("analytics_events").insert({
      event_name: eventName,
      properties: (properties ?? null) as never,
      session_id: getSessionId(),
    });
  } catch {
    // Analytics must never break the UI.
  }
};
