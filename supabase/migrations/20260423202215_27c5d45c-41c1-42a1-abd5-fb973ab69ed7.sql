
CREATE TYPE public.trigger_direction AS ENUM ('Above','Below');
CREATE TYPE public.trigger_source AS ENUM ('Manual','Webhook','File import');

CREATE TABLE public.triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  threshold_value NUMERIC NOT NULL,
  unit TEXT,
  direction public.trigger_direction NOT NULL DEFAULT 'Above',
  source_type public.trigger_source NOT NULL DEFAULT 'Manual',
  webhook_url TEXT,
  last_updated TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX triggers_contract_id_idx ON public.triggers(contract_id);
CREATE INDEX triggers_user_id_idx ON public.triggers(user_id);

ALTER TABLE public.triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own triggers" ON public.triggers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own triggers" ON public.triggers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid())
  );
CREATE POLICY "Users can update own triggers" ON public.triggers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own triggers" ON public.triggers
  FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE public.trigger_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_id UUID NOT NULL REFERENCES public.triggers(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source_ip TEXT
);

CREATE INDEX trigger_events_trigger_id_idx ON public.trigger_events(trigger_id);

ALTER TABLE public.trigger_events ENABLE ROW LEVEL SECURITY;

-- Owners can read events for their triggers
CREATE POLICY "Users can view events for own triggers" ON public.trigger_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.triggers t WHERE t.id = trigger_id AND t.user_id = auth.uid())
  );
-- No client-side INSERT/UPDATE/DELETE — only the service role (edge function) writes events.
