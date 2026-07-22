CREATE TABLE public.contract_beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  beneficiary_name TEXT NOT NULL,
  beneficiary_contact TEXT,
  share_pct NUMERIC(6,3) NOT NULL CHECK (share_pct >= 0 AND share_pct <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_beneficiaries_contract ON public.contract_beneficiaries(contract_id);
CREATE INDEX idx_contract_beneficiaries_user ON public.contract_beneficiaries(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_beneficiaries TO authenticated;
GRANT ALL ON public.contract_beneficiaries TO service_role;

ALTER TABLE public.contract_beneficiaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contract owner manages beneficiaries"
  ON public.contract_beneficiaries FOR ALL
  USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));

CREATE POLICY "Beneficiary can view own share"
  ON public.contract_beneficiaries FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.check_beneficiary_shares()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total NUMERIC;
BEGIN
  SELECT COALESCE(SUM(share_pct), 0) INTO total
  FROM public.contract_beneficiaries
  WHERE contract_id = NEW.contract_id
    AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF total + NEW.share_pct > 100 THEN
    RAISE EXCEPTION 'Beneficiary shares for contract % would exceed 100%% (existing % + new %)',
      NEW.contract_id, total, NEW.share_pct;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_beneficiary_shares
  BEFORE INSERT OR UPDATE ON public.contract_beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.check_beneficiary_shares();