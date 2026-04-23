CREATE OR REPLACE FUNCTION public.prevent_contributor_id_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.contributor_id IS NOT NULL AND NEW.contributor_id IS DISTINCT FROM OLD.contributor_id THEN
    RAISE EXCEPTION 'contributor_id is immutable once assigned';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_lock_contributor_id ON public.profiles;
CREATE TRIGGER profiles_lock_contributor_id
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_contributor_id_change();