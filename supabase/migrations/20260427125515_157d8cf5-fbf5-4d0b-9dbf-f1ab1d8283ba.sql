-- Create private schema not exposed by PostgREST
CREATE SCHEMA IF NOT EXISTS app_private;
REVOKE ALL ON SCHEMA app_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA app_private TO postgres, service_role;

-- Move all SECURITY DEFINER helpers into app_private.
ALTER FUNCTION public.handle_new_user() SET SCHEMA app_private;
ALTER FUNCTION public.touch_updated_at() SET SCHEMA app_private;
ALTER FUNCTION public.prevent_evidence_immutable_change() SET SCHEMA app_private;
ALTER FUNCTION public.prevent_evidence_delete() SET SCHEMA app_private;
ALTER FUNCTION public.prevent_contributor_id_change() SET SCHEMA app_private;
ALTER FUNCTION public.prevent_notification_field_change() SET SCHEMA app_private;
ALTER FUNCTION public.notify_execution_settlement_due() SET SCHEMA app_private;
ALTER FUNCTION public.notify_trigger_threshold_crossed() SET SCHEMA app_private;
ALTER FUNCTION public.guard_signer_role_change() SET SCHEMA app_private;
ALTER FUNCTION public.has_role(uuid, app_role) SET SCHEMA app_private;
ALTER FUNCTION public.current_signer_role() SET SCHEMA app_private;
ALTER FUNCTION public.get_admin_stats() SET SCHEMA app_private;
ALTER FUNCTION public.get_admin_user_list() SET SCHEMA app_private;
ALTER FUNCTION public.complete_profile_with_contributor_id(text, text, text, sector_type) SET SCHEMA app_private;
ALTER FUNCTION public.current_user_has_redeemed_invite() SET SCHEMA app_private;
ALTER FUNCTION public.redeem_invite_code(text, uuid) SET SCHEMA app_private;
ALTER FUNCTION public.soft_delete_account() SET SCHEMA app_private;
ALTER FUNCTION public.validate_invite_code(text, text) SET SCHEMA app_private;
ALTER FUNCTION public.get_public_passport(text) SET SCHEMA app_private;
ALTER FUNCTION public.get_attestation_by_token(uuid) SET SCHEMA app_private;
ALTER FUNCTION public.submit_attestation(uuid, text, text) SET SCHEMA app_private;

-- Re-fix internal call sites: these private functions reference each other
-- and the RLS policy uses public.current_signer_role(). We must keep the
-- references resolving. ALTER FUNCTION ... SET SCHEMA does not rewrite
-- function bodies, so re-create dependents that name them by `public.xxx`.

-- The RLS policy on evidence_sign_offs referenced public.current_signer_role.
-- Update it to point to the new schema.
DROP POLICY IF EXISTS "Signer inserts own sign-off if role allows" ON public.evidence_sign_offs;
CREATE POLICY "Signer inserts own sign-off if role allows"
  ON public.evidence_sign_offs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    signer_user_id = auth.uid()
    AND (
      (signer_role = 'reviewer'
        AND app_private.current_signer_role() IN ('reviewer'::public.signer_role,
                                                  'approver'::public.signer_role))
      OR
      (signer_role = 'approver'
        AND app_private.current_signer_role() = 'approver'::public.signer_role
        AND EXISTS (
          SELECT 1 FROM public.evidence_sign_offs s
          WHERE s.mapping_id = evidence_sign_offs.mapping_id
            AND s.signer_role = 'reviewer'
        ))
    )
  );

-- guard_signer_role_change references public.has_role; recreate with the new path.
CREATE OR REPLACE FUNCTION app_private.guard_signer_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.signer_role IS DISTINCT FROM OLD.signer_role
     AND NOT app_private.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change signer_role';
  END IF;
  RETURN NEW;
END;
$fn$;

-- Existing RLS policies on user_roles, invite_codes, demo_requests, analytics_events
-- referenced public.has_role(...). Re-create these policies so they call the
-- function in its new schema.
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles"
  ON public.user_roles
  FOR ALL
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins view all roles" ON public.user_roles;
CREATE POLICY "Admins view all roles"
  ON public.user_roles
  FOR SELECT
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins delete invite codes" ON public.invite_codes;
CREATE POLICY "Admins delete invite codes"
  ON public.invite_codes
  FOR DELETE
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins insert invite codes" ON public.invite_codes;
CREATE POLICY "Admins insert invite codes"
  ON public.invite_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins update invite codes" ON public.invite_codes;
CREATE POLICY "Admins update invite codes"
  ON public.invite_codes
  FOR UPDATE
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins view invite codes" ON public.invite_codes;
CREATE POLICY "Admins view invite codes"
  ON public.invite_codes
  FOR SELECT
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins view demo requests" ON public.demo_requests;
CREATE POLICY "Admins view demo requests"
  ON public.demo_requests
  FOR SELECT
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins view analytics events" ON public.analytics_events;
CREATE POLICY "Admins view analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

-- Public RPC wrappers (SECURITY INVOKER) for the 11 functions called by app code.
-- Each runs as the caller, then delegates to the private SECURITY DEFINER impl.

-- Authenticated-only wrappers: forbid anon at the wrapper level too.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.has_role(_user_id, _role);
$$;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.get_admin_stats();
$$;
REVOKE EXECUTE ON FUNCTION public.get_admin_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_admin_user_list()
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.get_admin_user_list();
$$;
REVOKE EXECUTE ON FUNCTION public.get_admin_user_list() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_user_list() TO authenticated;

CREATE OR REPLACE FUNCTION public.complete_profile_with_contributor_id(
  p_full_name text, p_professional_role text, p_organisation text, p_sector sector_type
) RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.complete_profile_with_contributor_id(p_full_name, p_professional_role, p_organisation, p_sector);
$$;
REVOKE EXECUTE ON FUNCTION public.complete_profile_with_contributor_id(text, text, text, sector_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_profile_with_contributor_id(text, text, text, sector_type) TO authenticated;

CREATE OR REPLACE FUNCTION public.current_user_has_redeemed_invite()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.current_user_has_redeemed_invite();
$$;
REVOKE EXECUTE ON FUNCTION public.current_user_has_redeemed_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_has_redeemed_invite() TO authenticated;

CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text, p_user_id uuid)
RETURNS boolean LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.redeem_invite_code(p_code, p_user_id);
$$;
REVOKE EXECUTE ON FUNCTION public.redeem_invite_code(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_invite_code(text, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.soft_delete_account()
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.soft_delete_account();
$$;
REVOKE EXECUTE ON FUNCTION public.soft_delete_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_account() TO authenticated;

CREATE OR REPLACE FUNCTION public.current_signer_role()
RETURNS public.signer_role LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.current_signer_role();
$$;
REVOKE EXECUTE ON FUNCTION public.current_signer_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_signer_role() TO authenticated;

-- Anon-callable public wrappers (intentional public flows).
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text, p_email text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.validate_invite_code(p_code, p_email);
$$;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text, text) TO PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_public_passport(p_contributor_id text)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.get_public_passport(p_contributor_id);
$$;
GRANT EXECUTE ON FUNCTION public.get_public_passport(text) TO PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_attestation_by_token(p_token uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.get_attestation_by_token(p_token);
$$;
GRANT EXECUTE ON FUNCTION public.get_attestation_by_token(uuid) TO PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_attestation(p_token uuid, p_decision text, p_notes text DEFAULT NULL)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path = public AS $$
  SELECT app_private.submit_attestation(p_token, p_decision, p_notes);
$$;
GRANT EXECUTE ON FUNCTION public.submit_attestation(uuid, text, text) TO PUBLIC, anon, authenticated;