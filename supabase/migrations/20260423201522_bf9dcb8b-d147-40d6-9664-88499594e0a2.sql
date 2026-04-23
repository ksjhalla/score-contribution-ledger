
CREATE TYPE public.counterparty_type AS ENUM (
  'Company','Cooperative','University','Platform','Individual','Government'
);

CREATE TYPE public.stake_type AS ENUM (
  'Financial','Attribution','Governance','Mixed'
);

CREATE TYPE public.contract_type AS ENUM (
  'Off-chain','On-chain reference'
);

CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  counterparty_name TEXT NOT NULL,
  counterparty_type public.counterparty_type NOT NULL,
  stake_type public.stake_type NOT NULL,
  contract_type public.contract_type NOT NULL,
  reference TEXT,
  entitlement_description TEXT NOT NULL,
  trigger_description TEXT NOT NULL,
  attestation_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contracts_user_id_idx ON public.contracts(user_id);

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contracts" ON public.contracts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contracts" ON public.contracts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contracts" ON public.contracts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contracts" ON public.contracts
  FOR DELETE USING (auth.uid() = user_id);
