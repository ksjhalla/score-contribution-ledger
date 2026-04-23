
CREATE TYPE public.execution_status AS ENUM (
  'Pending','Attested','Settled','Intent logged'
);

CREATE TYPE public.settlement_channel AS ENUM (
  'Bank transfer','Stripe','Coinbase','USDC','Other','Not applicable'
);

CREATE TABLE public.executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  work_description TEXT NOT NULL,
  trigger_met BOOLEAN NOT NULL DEFAULT false,
  status public.execution_status NOT NULL DEFAULT 'Pending',
  evidence_ids UUID[] NOT NULL DEFAULT '{}',
  settlement_channel public.settlement_channel,
  settlement_reference TEXT,
  settled_amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  execution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX executions_contract_id_idx ON public.executions(contract_id);
CREATE INDEX executions_user_id_idx ON public.executions(user_id);

ALTER TABLE public.executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own executions" ON public.executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert executions on own contracts" ON public.executions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can update own executions" ON public.executions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own executions" ON public.executions
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER executions_touch_updated
  BEFORE UPDATE ON public.executions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
