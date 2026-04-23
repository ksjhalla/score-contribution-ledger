
-- Notification type enum
CREATE TYPE public.notification_type AS ENUM (
  'trigger_met',
  'execution_pending',
  'settlement_due',
  'attestation_requested',
  'system'
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type public.notification_type NOT NULL,
  contract_id UUID NULL,
  execution_id UUID NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id) WHERE read = false;
CREATE INDEX idx_notifications_execution_type_created ON public.notifications (execution_id, type, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Prevent evidence rows from being deleted (immutability)
CREATE OR REPLACE FUNCTION public.prevent_evidence_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'evidence rows are immutable and cannot be deleted';
END;
$$;

DROP TRIGGER IF EXISTS evidence_no_delete ON public.evidence;
CREATE TRIGGER evidence_no_delete
  BEFORE DELETE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_delete();

-- Make sure the existing immutability trigger for fingerprint/timestamp is wired up
DROP TRIGGER IF EXISTS evidence_immutable ON public.evidence;
CREATE TRIGGER evidence_immutable
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_immutable_change();

-- Extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
