CREATE OR REPLACE FUNCTION public.get_public_passport(p_contributor_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  prof RECORD;
  contracts_json JSONB;
  total_value NUMERIC := 0;
  exec_count INT := 0;
  work_total INT := 0;
  work_pending INT := 0;
  work_settled INT := 0;
  work_settled_value NUMERIC := 0;
BEGIN
  SELECT * INTO prof FROM public.profiles
   WHERE contributor_id = p_contributor_id
     AND profile_completed = true
     AND passport_visible = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF prof.passport_first_shared_at IS NULL THEN
    UPDATE public.profiles
       SET passport_first_shared_at = now()
     WHERE id = prof.id;
    prof.passport_first_shared_at := now();
  END IF;

  SELECT COALESCE(SUM(settled_amount), 0), COUNT(*)
    INTO total_value, exec_count
    FROM public.executions
   WHERE user_id = prof.id AND trigger_met = true;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'Pending'),
    COUNT(*) FILTER (WHERE status = 'Settled'),
    COALESCE(SUM(settled_amount) FILTER (WHERE status = 'Settled'), 0)
    INTO work_total, work_pending, work_settled, work_settled_value
    FROM public.work_entries
   WHERE user_id = prof.id;

  SELECT COALESCE(jsonb_agg(row_to_json(c2) ORDER BY c2.created_at DESC), '[]'::jsonb)
    INTO contracts_json
    FROM (
      SELECT
        c.id,
        CASE WHEN prof.show_contracts THEN c.name ELSE NULL END AS name,
        c.stake_type,
        CASE WHEN prof.show_counterparties THEN c.counterparty_name ELSE NULL END AS counterparty_name,
        c.created_at,
        (SELECT COUNT(*) FROM public.executions e WHERE e.contract_id = c.id) AS execution_count,
        (SELECT COUNT(*) FROM public.executions e
           WHERE e.contract_id = c.id AND e.status = 'Settled') AS settled_count,
        (SELECT COUNT(*) FROM public.executions e
           WHERE e.contract_id = c.id AND e.status = 'Pending' AND e.trigger_met = true) AS pending_count
      FROM public.contracts c
      WHERE c.user_id = prof.id
    ) AS c2;

  RETURN jsonb_build_object(
    'contributor_id', prof.contributor_id,
    'full_name', prof.full_name,
    'professional_role', prof.professional_role,
    'sector', prof.sector,
    'show_amounts', prof.show_amounts,
    'show_counterparties', prof.show_counterparties,
    'show_contracts', prof.show_contracts,
    'first_shared_at', prof.passport_first_shared_at,
    'summary', jsonb_build_object(
      'contracts', (SELECT COUNT(*) FROM public.contracts c WHERE c.user_id = prof.id),
      'executions', exec_count,
      'attributed_value', CASE WHEN prof.show_amounts THEN total_value ELSE NULL END,
      'currency', 'USD',
      'work_entries', work_total,
      'work_pending', work_pending,
      'work_settled', work_settled,
      'work_settled_value', CASE WHEN prof.show_amounts THEN work_settled_value ELSE NULL END
    ),
    'contracts', contracts_json
  );
END;
$function$;