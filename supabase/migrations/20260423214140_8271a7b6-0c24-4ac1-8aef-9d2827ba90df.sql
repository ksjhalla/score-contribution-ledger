-- Attestation status enum
CREATE TYPE public.attestation_status AS ENUM ('Pending', 'Confirmed', 'Declined');

-- Add 'Declined' to execution_status if not present
ALTER TYPE public.execution_status ADD VALUE IF NOT EXISTS 'Declined';

-- contract_attestors: people whose confirmation is required for executions on a contract
CREATE TABLE public.contract_attestors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attestor_email TEXT NOT NULL,
  attestor_name TEXT NOT NULL,
  attestor_role TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contract_id, attestor_email)
);

ALTER TABLE public.contract_attestors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own contract attestors"
  ON public.contract_attestors FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert attestors on own contracts"
  ON public.contract_attestors FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()
  ));
CREATE POLICY "Users update own contract attestors"
  ON public.contract_attestors FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own contract attestors"
  ON public.contract_attestors FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_contract_attestors_contract ON public.contract_attestors(contract_id);

-- execution_attestations: per-execution attestor responses
CREATE TABLE public.execution_attestations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  execution_id UUID NOT NULL REFERENCES public.executions(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- contributor (execution owner)
  attestor_email TEXT NOT NULL,
  attestor_name TEXT NOT NULL,
  status public.attestation_status NOT NULL DEFAULT 'Pending',
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  notes TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  last_nudged_at TIMESTAMPTZ,
  UNIQUE (execution_id, attestor_email)
);

ALTER TABLE public.execution_attestations ENABLE ROW LEVEL SECURITY;

-- Contributor can view/manage their own attestations
CREATE POLICY "Users view own execution attestations"
  ON public.execution_attestations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own execution attestations"
  ON public.execution_attestations FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM public.executions e WHERE e.id = execution_id AND e.user_id = auth.uid()
  ));
CREATE POLICY "Users update own execution attestations"
  ON public.execution_attestations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own execution attestations"
  ON public.execution_attestations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_execution_attestations_exec ON public.execution_attestations(execution_id);
CREATE INDEX idx_execution_attestations_token ON public.execution_attestations(token);

-- Public function: fetch attestation by token (no login required)
CREATE OR REPLACE FUNCTION public.get_attestation_by_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', a.id,
    'status', a.status,
    'attestor_name', a.attestor_name,
    'attestor_email', a.attestor_email,
    'requested_at', a.requested_at,
    'responded_at', a.responded_at,
    'notes', a.notes,
    'execution', jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'work_description', e.work_description,
      'execution_date', e.execution_date,
      'status', e.status
    ),
    'contract', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'counterparty_name', c.counterparty_name,
      'stake_type', c.stake_type
    ),
    'contributor', jsonb_build_object(
      'full_name', p.full_name,
      'professional_role', p.professional_role
    ),
    'evidence', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', ev.id, 'title', ev.title, 'evidence_type', ev.evidence_type))
      FROM public.evidence ev
      WHERE ev.id = ANY(e.evidence_ids)
    ), '[]'::jsonb)
  ) INTO result
  FROM public.execution_attestations a
  JOIN public.executions e ON e.id = a.execution_id
  JOIN public.contracts c ON c.id = a.contract_id
  JOIN public.profiles p ON p.id = a.user_id
  WHERE a.token = p_token;

  RETURN result;
END;
$$;

-- Public function: submit attestation response by token
CREATE OR REPLACE FUNCTION public.submit_attestation(
  p_token UUID,
  p_decision TEXT, -- 'Confirmed' or 'Declined'
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  att RECORD;
  exec_rec RECORD;
  total INT;
  confirmed_ct INT;
  declined_ct INT;
  pending_ct INT;
  new_status public.execution_status;
  decline_summary TEXT;
  contract_name TEXT;
BEGIN
  IF p_decision NOT IN ('Confirmed','Declined') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO att FROM public.execution_attestations WHERE token = p_token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attestation not found';
  END IF;
  IF att.status <> 'Pending' THEN
    RAISE EXCEPTION 'Already responded';
  END IF;

  UPDATE public.execution_attestations
     SET status = p_decision::public.attestation_status,
         responded_at = now(),
         notes = p_notes
   WHERE id = att.id;

  -- Tally
  SELECT COUNT(*),
         COUNT(*) FILTER (WHERE status = 'Confirmed'),
         COUNT(*) FILTER (WHERE status = 'Declined'),
         COUNT(*) FILTER (WHERE status = 'Pending')
    INTO total, confirmed_ct, declined_ct, pending_ct
    FROM public.execution_attestations
   WHERE execution_id = att.execution_id;

  SELECT * INTO exec_rec FROM public.executions WHERE id = att.execution_id;
  SELECT name INTO contract_name FROM public.contracts WHERE id = att.contract_id;

  -- Only finalize when nobody is still pending
  IF pending_ct = 0 THEN
    IF declined_ct > 0 THEN
      SELECT string_agg(attestor_name || COALESCE(' ('||notes||')',''), '; ')
        INTO decline_summary
        FROM public.execution_attestations
       WHERE execution_id = att.execution_id AND status = 'Declined';
      new_status := 'Declined';
      UPDATE public.executions
         SET status = new_status,
             notes = COALESCE(notes,'') || E'\nDeclined by: ' || COALESCE(decline_summary,'')
       WHERE id = att.execution_id;
    ELSE
      new_status := 'Attested';
      UPDATE public.executions SET status = new_status WHERE id = att.execution_id;
    END IF;
  END IF;

  -- Notify contributor of this single response
  INSERT INTO public.notifications (user_id, type, contract_id, execution_id, message, email_sent)
  VALUES (
    att.user_id,
    'attestation_requested',
    att.contract_id,
    att.execution_id,
    'Your execution on ' || COALESCE(contract_name,'contract') || ' was ' ||
      CASE WHEN p_decision = 'Confirmed' THEN 'confirmed' ELSE 'declined' END ||
      ' by ' || att.attestor_name,
    false
  );

  RETURN jsonb_build_object(
    'ok', true,
    'execution_status', COALESCE(new_status::text, exec_rec.status::text),
    'totals', jsonb_build_object('total', total, 'confirmed', confirmed_ct, 'declined', declined_ct, 'pending', pending_ct)
  );
END;
$$;

-- Allow anonymous calls to the public RPCs
GRANT EXECUTE ON FUNCTION public.get_attestation_by_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_attestation(UUID, TEXT, TEXT) TO anon, authenticated;