
CREATE TABLE public.reminder_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL,
  reminder_type text NOT NULL DEFAULT 'settlement_due',
  execution_id uuid REFERENCES public.executions(id) ON DELETE SET NULL,
  contract_id uuid REFERENCES public.contracts(id) ON DELETE SET NULL,
  user_id uuid,
  execution_date date,
  settled_amount numeric,
  currency text,
  outcome text NOT NULL CHECK (outcome IN ('sent','skipped_dedupe','error')),
  reason text,
  notification_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reminder_audit_log_run_id_idx ON public.reminder_audit_log(run_id);
CREATE INDEX reminder_audit_log_user_id_idx ON public.reminder_audit_log(user_id);
CREATE INDEX reminder_audit_log_created_at_idx ON public.reminder_audit_log(created_at DESC);

GRANT SELECT ON public.reminder_audit_log TO authenticated;
GRANT ALL ON public.reminder_audit_log TO service_role;

ALTER TABLE public.reminder_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read their own reminder audit entries"
  ON public.reminder_audit_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
