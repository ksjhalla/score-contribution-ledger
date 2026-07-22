
CREATE OR REPLACE FUNCTION app_private.complete_profile_with_contributor_id(p_full_name text, p_professional_role text, p_organisation text, p_sector sector_type)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  signup_year int;
  initials text;
  parts text[];
  candidate text;
  seq int := 1;
  max_attempts int := 999;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Enforce invite-only signup at the database layer. The client flow calls
  -- redeem_invite_code before this RPC, but that ordering is not trustworthy:
  -- reject any caller who has not redeemed a valid invite.
  IF NOT app_private.current_user_has_redeemed_invite() THEN
    RAISE EXCEPTION 'A valid redeemed invite code is required to complete your profile'
      USING ERRCODE = '42501';
  END IF;

  IF p_full_name IS NULL OR length(btrim(p_full_name)) = 0 THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;
  IF p_professional_role IS NULL OR length(btrim(p_professional_role)) = 0 THEN
    RAISE EXCEPTION 'Professional role is required';
  END IF;
  IF p_sector IS NULL THEN
    RAISE EXCEPTION 'Sector is required';
  END IF;

  SELECT EXTRACT(YEAR FROM COALESCE(u.created_at, now()))::int
    INTO signup_year
    FROM auth.users u WHERE u.id = uid;
  IF signup_year IS NULL THEN
    signup_year := EXTRACT(YEAR FROM now())::int;
  END IF;

  parts := regexp_split_to_array(btrim(p_full_name), '\s+');
  IF array_length(parts, 1) IS NULL THEN
    initials := 'XX';
  ELSIF array_length(parts, 1) = 1 THEN
    initials := upper(rpad(left(parts[1], 2), 2, 'X'));
  ELSE
    initials := upper(left(parts[1], 1) || left(parts[array_length(parts,1)], 1));
  END IF;

  WHILE seq <= max_attempts LOOP
    candidate := 'SCR-' || initials || '-' || signup_year::text || '-' || lpad(seq::text, 3, '0');
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE contributor_id = candidate) THEN
      EXIT;
    END IF;
    seq := seq + 1;
  END LOOP;

  IF seq > max_attempts THEN
    RAISE EXCEPTION 'Could not allocate a unique Contributor ID';
  END IF;

  BEGIN
    UPDATE public.profiles
       SET full_name = btrim(p_full_name),
           professional_role = btrim(p_professional_role),
           organisation = NULLIF(btrim(COALESCE(p_organisation,'')), ''),
           sector = p_sector,
           contributor_id = candidate,
           profile_completed = true
     WHERE id = uid;
  EXCEPTION WHEN unique_violation THEN
    seq := seq + 1;
    WHILE seq <= max_attempts LOOP
      candidate := 'SCR-' || initials || '-' || signup_year::text || '-' || lpad(seq::text, 3, '0');
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE contributor_id = candidate) THEN
        EXIT;
      END IF;
      seq := seq + 1;
    END LOOP;
    UPDATE public.profiles
       SET full_name = btrim(p_full_name),
           professional_role = btrim(p_professional_role),
           organisation = NULLIF(btrim(COALESCE(p_organisation,'')), ''),
           sector = p_sector,
           contributor_id = candidate,
           profile_completed = true
     WHERE id = uid;
  END;

  RETURN jsonb_build_object('contributor_id', candidate);
END;
$function$;
