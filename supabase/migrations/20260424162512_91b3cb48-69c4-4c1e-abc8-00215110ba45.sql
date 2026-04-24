-- ============================================================
-- PART 1: INVITE CODES
-- ============================================================

CREATE TABLE public.invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  email TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invite_codes_code ON public.invite_codes(code);
CREATE INDEX idx_invite_codes_email ON public.invite_codes(lower(email));

ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view invite codes"
  ON public.invite_codes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert invite codes"
  ON public.invite_codes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update invite codes"
  ON public.invite_codes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete invite codes"
  ON public.invite_codes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public validator: returns true if a code is currently usable
-- and (if email-locked) matches p_email.
CREATE OR REPLACE FUNCTION public.validate_invite_code(
  p_code TEXT,
  p_email TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code public.invite_codes%ROWTYPE;
BEGIN
  IF p_code IS NULL OR length(btrim(p_code)) = 0 THEN
    RETURN false;
  END IF;

  SELECT * INTO v_code
    FROM public.invite_codes
   WHERE code = btrim(p_code)
     AND (expires_at IS NULL OR expires_at > now())
     AND (max_uses IS NULL OR use_count < max_uses);

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_code.email IS NOT NULL
     AND lower(v_code.email) <> lower(COALESCE(p_email, '')) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Public redeemer: increments use_count and stamps used_by/used_at.
-- Re-checks validity inside the transaction to prevent race conditions.
CREATE OR REPLACE FUNCTION public.redeem_invite_code(
  p_code TEXT,
  p_user_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated INT;
BEGIN
  UPDATE public.invite_codes
     SET used_by = COALESCE(used_by, p_user_id),
         used_at = COALESCE(used_at, now()),
         use_count = use_count + 1
   WHERE code = btrim(p_code)
     AND (expires_at IS NULL OR expires_at > now())
     AND (max_uses IS NULL OR use_count < max_uses);

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_invite_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(TEXT, UUID) TO anon, authenticated;

-- Seed the founder code
INSERT INTO public.invite_codes (code, note, max_uses)
VALUES ('SCORE-EARLY-2026', 'Founder access — unlimited uses', 999)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- PART 2: ATTESTATION TYPE + DOCUMENT FINGERPRINT
-- ============================================================

ALTER TABLE public.execution_attestations
  ADD COLUMN IF NOT EXISTS attestation_type TEXT NOT NULL DEFAULT 'person'
    CHECK (attestation_type IN ('person', 'document')),
  ADD COLUMN IF NOT EXISTS document_fingerprint TEXT;

-- Allow attestor_email to be null for document attestations
ALTER TABLE public.execution_attestations
  ALTER COLUMN attestor_email DROP NOT NULL;
