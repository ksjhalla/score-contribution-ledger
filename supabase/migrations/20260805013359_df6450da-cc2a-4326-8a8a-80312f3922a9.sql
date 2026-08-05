CREATE TABLE public.nandi_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  note text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.nandi_invites TO authenticated;
GRANT ALL ON public.nandi_invites TO service_role;

ALTER TABLE public.nandi_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view nandi invites" ON public.nandi_invites FOR SELECT TO authenticated USING (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins insert nandi invites" ON public.nandi_invites FOR INSERT TO authenticated WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update nandi invites" ON public.nandi_invites FOR UPDATE TO authenticated USING (app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete nandi invites" ON public.nandi_invites FOR DELETE TO authenticated USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION app_private.has_nandi_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.nandi_invites ni
    JOIN auth.users u ON lower(u.email) = lower(ni.email)
    WHERE u.id = _user_id
      AND ni.revoked_at IS NULL
  )
$$;

CREATE OR REPLACE FUNCTION public.has_nandi_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT app_private.has_nandi_access(_user_id);
$$;