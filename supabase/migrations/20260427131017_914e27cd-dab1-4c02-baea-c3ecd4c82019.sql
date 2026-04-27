-- Admin: list profiles with signer_role
CREATE OR REPLACE FUNCTION app_private.admin_list_signer_roles()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT app_private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(t))
    FROM (
      SELECT
        p.id,
        p.full_name,
        p.contributor_id,
        p.signer_role,
        p.organisation,
        p.professional_role,
        p.created_at
      FROM public.profiles p
      WHERE p.deleted_at IS NULL
      ORDER BY p.created_at DESC
    ) t
  ), '[]'::jsonb);
END;
$$;

REVOKE EXECUTE ON FUNCTION app_private.admin_list_signer_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.admin_list_signer_roles() TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_list_signer_roles()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT app_private.admin_list_signer_roles();
$$;

REVOKE EXECUTE ON FUNCTION public.admin_list_signer_roles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_signer_roles() TO authenticated;

-- Admin: update a user's signer_role
CREATE OR REPLACE FUNCTION app_private.admin_set_signer_role(
  p_user_id uuid,
  p_role public.signer_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated public.profiles%ROWTYPE;
BEGIN
  IF NOT app_private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.profiles
     SET signer_role = p_role,
         updated_at = now()
   WHERE id = p_user_id
   RETURNING * INTO v_updated;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found' USING ERRCODE = 'P0002';
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_updated.id,
    'signer_role', v_updated.signer_role
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION app_private.admin_set_signer_role(uuid, public.signer_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION app_private.admin_set_signer_role(uuid, public.signer_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_signer_role(
  p_user_id uuid,
  p_role public.signer_role
)
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT app_private.admin_set_signer_role(p_user_id, p_role);
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_signer_role(uuid, public.signer_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_signer_role(uuid, public.signer_role) TO authenticated;