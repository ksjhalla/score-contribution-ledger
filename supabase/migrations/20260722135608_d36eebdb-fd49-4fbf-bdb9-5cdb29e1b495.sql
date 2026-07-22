CREATE OR REPLACE VIEW public.contributor_credit_signal AS
SELECT
  e.user_id,
  COUNT(*) FILTER (WHERE e.status = 'Settled') AS settlements_count,
  COALESCE(SUM(e.settled_amount) FILTER (WHERE e.status = 'Settled'), 0) AS total_settled,
  COALESCE(SUM(e.settled_amount) FILTER (WHERE e.status = 'Pending'), 0) AS total_pending,
  MIN(e.execution_date) FILTER (WHERE e.status = 'Settled') AS first_settlement_date,
  MAX(e.execution_date) FILTER (WHERE e.status = 'Settled') AS most_recent_settlement_date,
  COUNT(DISTINCT e.contract_id) AS distinct_contracts
FROM public.executions e
GROUP BY e.user_id;

ALTER VIEW public.contributor_credit_signal SET (security_invoker = true);

GRANT SELECT ON public.contributor_credit_signal TO authenticated;

COMMENT ON VIEW public.contributor_credit_signal IS
  'Aggregated settlement history per contributor, for lender-facing credit signal summaries. The interpretive verdict text stays in the frontend — this view only supplies the underlying numbers.';