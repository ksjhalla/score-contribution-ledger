
CREATE OR REPLACE FUNCTION app_private.get_reminder_job_runs(p_limit int DEFAULT 20)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jobid bigint;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jobid INTO v_jobid
    FROM cron.job
   WHERE command ILIKE '%overdue-settlement-reminders%'
   ORDER BY jobid DESC
   LIMIT 1;

  RETURN jsonb_build_object(
    'job', (
      SELECT to_jsonb(j) FROM (
        SELECT jobid, jobname, schedule, active
          FROM cron.job WHERE jobid = v_jobid
      ) j
    ),
    'runs', COALESCE((
      SELECT jsonb_agg(row_to_json(r) ORDER BY r.start_time DESC)
      FROM (
        SELECT
          d.runid,
          d.status,
          d.return_message,
          d.start_time,
          d.end_time,
          EXTRACT(EPOCH FROM (d.end_time - d.start_time)) AS duration_seconds,
          COALESCE(counts.processed, 0) AS processed,
          COALESCE(counts.sent, 0)      AS sent,
          COALESCE(counts.skipped, 0)   AS skipped,
          COALESCE(counts.errored, 0)   AS errored
        FROM cron.job_run_details d
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*)                                    AS processed,
            COUNT(*) FILTER (WHERE outcome = 'sent')            AS sent,
            COUNT(*) FILTER (WHERE outcome = 'skipped_dedupe')  AS skipped,
            COUNT(*) FILTER (WHERE outcome = 'error')           AS errored
          FROM public.reminder_audit_log l
          WHERE l.created_at >= d.start_time
            AND l.created_at <= COALESCE(d.end_time, now())
        ) counts ON true
        WHERE d.jobid = v_jobid
        ORDER BY d.start_time DESC
        LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 20), 100))
      ) r
    ), '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_reminder_job_runs(p_limit int DEFAULT 20)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT app_private.get_reminder_job_runs(p_limit);
$$;

GRANT EXECUTE ON FUNCTION public.get_reminder_job_runs(int) TO authenticated;
