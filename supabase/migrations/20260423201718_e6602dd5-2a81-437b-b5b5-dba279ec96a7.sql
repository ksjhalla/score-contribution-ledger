
CREATE TYPE public.evidence_type AS ENUM (
  'Document','Dataset','Code','Measurement','Training record',
  'Patent filing','Batch record','Session file','Other'
);

CREATE TABLE public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  evidence_type public.evidence_type NOT NULL,
  source_url TEXT,
  fingerprint TEXT NOT NULL,
  timestamp_created TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX evidence_contract_id_idx ON public.evidence(contract_id);
CREATE INDEX evidence_user_id_idx ON public.evidence(user_id);

ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evidence" ON public.evidence
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert evidence on own contracts" ON public.evidence
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid())
  );

CREATE POLICY "Users can update own evidence" ON public.evidence
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own evidence" ON public.evidence
  FOR DELETE USING (auth.uid() = user_id);

-- Lock fingerprint and timestamp after creation
CREATE OR REPLACE FUNCTION public.prevent_evidence_immutable_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.fingerprint IS DISTINCT FROM OLD.fingerprint THEN
    RAISE EXCEPTION 'evidence.fingerprint is immutable';
  END IF;
  IF NEW.timestamp_created IS DISTINCT FROM OLD.timestamp_created THEN
    RAISE EXCEPTION 'evidence.timestamp_created is immutable';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER evidence_lock_immutable
  BEFORE UPDATE ON public.evidence
  FOR EACH ROW EXECUTE FUNCTION public.prevent_evidence_immutable_change();
