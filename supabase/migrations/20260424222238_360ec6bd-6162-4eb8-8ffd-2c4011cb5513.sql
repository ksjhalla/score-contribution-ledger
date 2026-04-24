
-- Add webhook_secret column to triggers (stores SHA-256 hash of the raw secret).
ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS webhook_secret text;

-- Add auth_failed + source_ip on trigger_events (source_ip already exists; keep IF NOT EXISTS).
ALTER TABLE public.trigger_events
  ADD COLUMN IF NOT EXISTS auth_failed boolean NOT NULL DEFAULT false;

ALTER TABLE public.trigger_events
  ADD COLUMN IF NOT EXISTS source_ip text;

-- Allow value to be null so we can log failed auth attempts (no body parsed).
ALTER TABLE public.trigger_events
  ALTER COLUMN value DROP NOT NULL;

-- Index for fast lookups by trigger + recency (rate limit + warning notice).
CREATE INDEX IF NOT EXISTS trigger_events_trigger_received_idx
  ON public.trigger_events (trigger_id, received_at DESC);
