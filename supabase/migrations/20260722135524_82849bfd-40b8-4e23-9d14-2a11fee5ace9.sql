CREATE OR REPLACE FUNCTION public.effective_stake_pct(
  p_base_stake_pct NUMERIC,
  p_decay_model public.decay_model,
  p_decay_rate_pct_per_year NUMERIC,
  p_decay_floor_pct NUMERIC,
  p_decay_started_at DATE,
  p_decay_cliff_date DATE,
  p_as_of DATE DEFAULT CURRENT_DATE
) RETURNS NUMERIC
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  years_elapsed NUMERIC;
  computed NUMERIC;
BEGIN
  IF p_decay_model = 'None' OR p_decay_started_at IS NULL THEN
    RETURN p_base_stake_pct;
  END IF;
  IF p_decay_model = 'Cliff' THEN
    IF p_decay_cliff_date IS NOT NULL AND p_as_of >= p_decay_cliff_date THEN
      RETURN COALESCE(p_decay_floor_pct, 0);
    END IF;
    RETURN p_base_stake_pct;
  END IF;
  IF p_decay_model = 'Linear' THEN
    years_elapsed := GREATEST(0, (p_as_of - p_decay_started_at) / 365.25);
    computed := p_base_stake_pct * (1 - COALESCE(p_decay_rate_pct_per_year, 0) / 100.0 * years_elapsed);
    RETURN GREATEST(computed, COALESCE(p_decay_floor_pct, 0));
  END IF;
  RETURN NULL;
END;
$$;