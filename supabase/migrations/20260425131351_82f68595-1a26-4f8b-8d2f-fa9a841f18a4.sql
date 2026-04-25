-- Restrict redeem_invite_code: reject anon role and enforce caller identity.
CREATE OR REPLACE FUNCTION public.redeem_invite_code(p_code text, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_updated INT;
  v_role text;
  v_sub text;
BEGIN
  v_role := current_setting('request.jwt.claims', true)::jsonb->>'role';
  v_sub  := current_setting('request.jwt.claims', true)::jsonb->>'sub';

  IF v_role IS NULL OR v_role = 'anon' THEN
    RAISE EXCEPTION 'Unauthorized: authenticated users only'
      USING ERRCODE = '42501';
  END IF;

  IF v_sub IS NULL OR p_user_id IS DISTINCT FROM v_sub::uuid THEN
    RAISE EXCEPTION 'Unauthorized: user ID mismatch'
      USING ERRCODE = '42501';
  END IF;

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
$function$;

-- Add a small uniform delay to validate_invite_code to slow enumeration.
CREATE OR REPLACE FUNCTION public.validate_invite_code(p_code text, p_email text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_code public.invite_codes%ROWTYPE;
BEGIN
  PERFORM pg_sleep(0.1);

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
$function$;