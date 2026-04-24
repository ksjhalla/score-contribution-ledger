CREATE OR REPLACE FUNCTION public.current_user_has_redeemed_invite()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.invite_codes
    WHERE used_by = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.current_user_has_redeemed_invite() TO authenticated;
