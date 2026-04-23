
-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'support');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer role check (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 3. RLS on user_roles
CREATE POLICY "Users view own role rows"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Soft-delete columns on profiles
ALTER TABLE public.profiles
  ADD COLUMN deleted_at timestamptz,
  ADD COLUMN anonymised boolean NOT NULL DEFAULT false;

-- 5. Soft-delete function (GDPR)
CREATE OR REPLACE FUNCTION public.soft_delete_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
     SET full_name = NULL,
         organisation = NULL,
         professional_role = NULL,
         passport_visible = false,
         anonymised = true,
         deleted_at = now()
   WHERE id = uid;

  -- Evidence + executions are retained (immutable record),
  -- but referenced as "Contributor SCR-[contributor_id]" in any UI.
  RETURN jsonb_build_object('ok', true, 'deleted_at', now());
END;
$$;

-- 6. Admin platform stats (no contract contents exposed)
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN jsonb_build_object(
    'total_contracts', (SELECT COUNT(*) FROM public.contracts),
    'total_executions', (SELECT COUNT(*) FROM public.executions),
    'total_settled_value', (SELECT COALESCE(SUM(settled_amount), 0) FROM public.executions WHERE status = 'Settled'),
    'total_users', (SELECT COUNT(*) FROM public.profiles WHERE COALESCE(anonymised, false) = false),
    'active_users_30d', (
      SELECT COUNT(DISTINCT user_id) FROM public.executions
       WHERE created_at >= now() - interval '30 days'
    )
  );
END;
$$;

-- 7. Admin user list (counts only — no contract contents)
CREATE OR REPLACE FUNCTION public.get_admin_user_list()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN COALESCE((
    SELECT jsonb_agg(row_to_json(u) ORDER BY u.last_active DESC NULLS LAST)
    FROM (
      SELECT
        p.id,
        p.contributor_id,
        CASE WHEN p.anonymised THEN NULL ELSE p.full_name END AS full_name,
        p.sector,
        p.created_at,
        p.anonymised,
        p.deleted_at,
        (SELECT COUNT(*) FROM public.contracts c WHERE c.user_id = p.id) AS contract_count,
        (SELECT COUNT(*) FROM public.executions e WHERE e.user_id = p.id) AS execution_count,
        (SELECT MAX(created_at) FROM public.executions e WHERE e.user_id = p.id) AS last_active
      FROM public.profiles p
    ) u
  ), '[]'::jsonb);
END;
$$;
