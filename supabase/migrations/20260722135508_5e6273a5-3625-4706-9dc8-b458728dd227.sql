CREATE TYPE public.decay_model AS ENUM ('None', 'Linear', 'Usage-based', 'Cliff');

ALTER TABLE public.contracts
  ADD COLUMN origin_contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL,
  ADD COLUMN decay_model public.decay_model NOT NULL DEFAULT 'None',
  ADD COLUMN decay_rate_pct_per_year NUMERIC(5,2),
  ADD COLUMN decay_floor_pct NUMERIC(5,2),
  ADD COLUMN decay_started_at DATE,
  ADD COLUMN decay_cliff_date DATE,
  ADD COLUMN buyout_multiple NUMERIC(5,2),
  ADD COLUMN revenue_cap_amount NUMERIC(18,2),
  ADD COLUMN revenue_cap_currency TEXT;

CREATE INDEX idx_contracts_origin ON public.contracts(origin_contract_id);

COMMENT ON COLUMN public.contracts.origin_contract_id IS
  'Self-reference to the contract this one derives from — e.g. a licence executed by another cooperative against a farmer''s original technique. NULL for origin contracts.';
COMMENT ON COLUMN public.contracts.decay_rate_pct_per_year IS
  'Used when decay_model = Linear. e.g. 15.00 = stake shrinks 15% per year from decay_started_at, floored at decay_floor_pct.';
COMMENT ON COLUMN public.contracts.decay_cliff_date IS
  'Used when decay_model = Cliff. Stake is full value until this date, then drops to decay_floor_pct (or 0 if unset).';
COMMENT ON COLUMN public.contracts.revenue_cap_amount IS
  'Optional ceiling on total payout under this contract (e.g. a derivative licence capped at a fixed amount per season) — prevents disproportionate extraction from a single adopter.';

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

GRANT EXECUTE ON FUNCTION public.effective_stake_pct(NUMERIC, public.decay_model, NUMERIC, NUMERIC, DATE, DATE, DATE) TO authenticated;