import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIMEOUT_MS = 30_000;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = req.headers.get('Authorization');
  if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } }
  );

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  const uid = userData.user.id;

  try {
    const result = await Promise.race([
      buildExport(supabase, uid),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TIMEOUT')), TIMEOUT_MS)),
    ]);

    const contributorId = result.profile?.contributor_id ?? 'anon';
    const date = new Date().toISOString().slice(0, 10);
    const filename = `SCORE-${contributorId}-export-${date}.json`;

    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    // Log the full error server-side only — never leak to the client.
    console.error('[export-user-data] Error:', e);
    if ((e as Error)?.message === 'TIMEOUT') {
      return new Response(JSON.stringify({ error: 'Export took too long. Please try again.' }), {
        status: 408,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Export failed. Please try again.' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function buildExport(supabase: any, uid: string) {
  const [profile, contracts, executions, evidence, triggers, triggerEvents, attestors, attestations] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(r => r.data),
    supabase.from('contracts').select('*').eq('user_id', uid).then(r => r.data ?? []),
    supabase.from('executions').select('*').eq('user_id', uid).then(r => r.data ?? []),
    supabase.from('evidence').select('id, contract_id, title, evidence_type, fingerprint, timestamp_created, source_url, description, notes, created_at').eq('user_id', uid).then(r => r.data ?? []),
    supabase.from('triggers').select('*').eq('user_id', uid).then(r => r.data ?? []),
    supabase.from('contracts').select('id').eq('user_id', uid).then(async (cRes) => {
      const ids = (cRes.data ?? []).map((c: any) => c.id);
      if (ids.length === 0) return [];
      const { data: trgs } = await supabase.from('triggers').select('id').eq('user_id', uid);
      const tIds = (trgs ?? []).map((t: any) => t.id);
      if (tIds.length === 0) return [];
      const { data } = await supabase.from('trigger_events').select('*').in('trigger_id', tIds);
      return data ?? [];
    }),
    supabase.from('contract_attestors').select('*').eq('user_id', uid).then(r => r.data ?? []),
    supabase.from('execution_attestations').select('*').eq('user_id', uid).then(r => r.data ?? []),
  ]);

  return {
    schema: 'score.export.v1',
    generated_at: new Date().toISOString(),
    contributor_id: (profile as any)?.contributor_id ?? null,
    profile,
    contracts,
    executions,
    evidence,
    triggers,
    trigger_events: triggerEvents,
    contract_attestors: attestors,
    execution_attestations: attestations,
  };
}