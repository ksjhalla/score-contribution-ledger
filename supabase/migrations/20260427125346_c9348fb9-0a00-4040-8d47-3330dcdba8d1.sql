-- 1) Lock down SECURITY DEFINER functions
-- Authenticated-only: revoke from anon and PUBLIC
REVOKE EXECUTE ON FUNCTION public.complete_profile_with_contributor_id(text, text, text, sector_type) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_user_has_redeemed_invite() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_list() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_invite_code(text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.soft_delete_account() FROM PUBLIC, anon;

-- Trigger-only helpers: revoke from PUBLIC, anon, and authenticated.
-- They are still invoked by triggers as the table owner; revoking API access does not break them.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_execution_settlement_due() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_trigger_threshold_crossed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_evidence_immutable_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_evidence_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_contributor_id_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_notification_field_change() FROM PUBLIC, anon, authenticated;

-- Public pages (intentionally anon-callable) — leave grants as-is:
--   get_public_passport, validate_invite_code, get_attestation_by_token, submit_attestation

-- 2) signer_role enum + column on profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'signer_role') THEN
    CREATE TYPE public.signer_role AS ENUM ('viewer', 'reviewer', 'approver');
  END IF;
END$$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signer_role public.signer_role NOT NULL DEFAULT 'viewer';

-- Only admins can change signer_role; users may still update other profile fields via the existing policy.
-- Enforce via a trigger so the existing "Users can update own profile" policy stays intact.
CREATE OR REPLACE FUNCTION public.guard_signer_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.signer_role IS DISTINCT FROM OLD.signer_role
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change signer_role';
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.guard_signer_role_change() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_guard_signer_role_change ON public.profiles;
CREATE TRIGGER trg_guard_signer_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_signer_role_change();

-- Helper to read current user's signer_role (used in RLS).
CREATE OR REPLACE FUNCTION public.current_signer_role()
RETURNS public.signer_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
  SELECT COALESCE(
    (SELECT signer_role FROM public.profiles WHERE id = auth.uid()),
    'viewer'::public.signer_role
  );
$fn$;
REVOKE EXECUTE ON FUNCTION public.current_signer_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_signer_role() TO authenticated;

-- 3) evidence_sign_offs table
CREATE TABLE IF NOT EXISTS public.evidence_sign_offs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mapping_id text NOT NULL,
  signer_user_id uuid NOT NULL,
  signer_role public.signer_role NOT NULL,
  signed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  CONSTRAINT evidence_sign_offs_role_check
    CHECK (signer_role IN ('reviewer', 'approver')),
  CONSTRAINT evidence_sign_offs_unique
    UNIQUE (mapping_id, signer_role)
);

CREATE INDEX IF NOT EXISTS idx_evidence_sign_offs_mapping
  ON public.evidence_sign_offs (mapping_id);

ALTER TABLE public.evidence_sign_offs ENABLE ROW LEVEL SECURITY;

-- Read: any authenticated user can read sign-offs (for audit visibility).
CREATE POLICY "Authenticated can read sign-offs"
  ON public.evidence_sign_offs
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert: only the signer themselves, and only if their profile signer_role allows it.
-- Reviewer rows require profile.signer_role IN ('reviewer','approver').
-- Approver rows require profile.signer_role = 'approver' AND an existing reviewer row for the mapping.
CREATE POLICY "Signer inserts own sign-off if role allows"
  ON public.evidence_sign_offs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    signer_user_id = auth.uid()
    AND (
      (signer_role = 'reviewer'
        AND public.current_signer_role() IN ('reviewer'::public.signer_role,
                                             'approver'::public.signer_role))
      OR
      (signer_role = 'approver'
        AND public.current_signer_role() = 'approver'::public.signer_role
        AND EXISTS (
          SELECT 1 FROM public.evidence_sign_offs s
          WHERE s.mapping_id = evidence_sign_offs.mapping_id
            AND s.signer_role = 'reviewer'
        ))
    )
  );

-- Block updates and deletes (sign-offs are append-only).
CREATE POLICY "No updates to sign-offs"
  ON public.evidence_sign_offs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "No deletes of sign-offs"
  ON public.evidence_sign_offs FOR DELETE TO authenticated USING (false);