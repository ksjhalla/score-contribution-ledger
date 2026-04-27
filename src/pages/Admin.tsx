import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShieldCheck, Copy, Check } from "lucide-react";
import { toast } from "sonner";

type Stats = { total_contracts: number; total_executions: number; total_settled_value: number; total_users: number; active_users_30d: number };
type UserRow = { id: string; contributor_id: string | null; full_name: string | null; sector: string | null; created_at: string; anonymised: boolean; deleted_at: string | null; contract_count: number; execution_count: number; last_active: string | null };
type InviteRow = { id: string; code: string; email: string | null; note: string | null; max_uses: number; use_count: number; expires_at: string | null; used_at: string | null; created_at: string };
type SignerRoleValue = "viewer" | "reviewer" | "approver";
type SignerRoleRow = { id: string; full_name: string | null; contributor_id: string | null; signer_role: SignerRoleValue; organisation: string | null; professional_role: string | null; created_at: string };

const randomSegment = (len = 4) => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
};
const newCode = () => `SCORE-${randomSegment()}-${randomSegment()}`;

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [authorised, setAuthorised] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [genEmail, setGenEmail] = useState("");
  const [genExpires, setGenExpires] = useState("");
  const [genMaxUses, setGenMaxUses] = useState("1");
  const [genNote, setGenNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [signerRoles, setSignerRoles] = useState<SignerRoleRow[]>([]);
  const [signerSearch, setSignerSearch] = useState("");
  const [signerSaving, setSignerSaving] = useState<string | null>(null);

  const loadSignerRoles = async () => {
    const { data, error } = await supabase.rpc("admin_list_signer_roles");
    if (error) { toast.error(error.message); return; }
    setSignerRoles((data as unknown as SignerRoleRow[]) ?? []);
  };

  const loadInvites = async () => {
    const { data } = await supabase.from("invite_codes").select("*").order("created_at", { ascending: false });
    setInvites((data as InviteRow[]) ?? []);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      const isAdmin = (roleRows ?? []).length > 0;
      setAuthorised(isAdmin);
      if (!isAdmin) return;
      const [s, u, _i] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.rpc("get_admin_user_list"),
        loadInvites(),
        loadSignerRoles(),
      ]);
      setStats(s.data as unknown as Stats);
      setUsers((u.data as unknown as UserRow[]) ?? []);
    })();
  }, [user, loading, navigate]);

  const handleGenerate = async () => {
    setGenerating(true);
    const max = Math.max(1, parseInt(genMaxUses || "1", 10) || 1);
    let code = "";
    let success = false;
    let lastError: string | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      code = newCode();
      const { count } = await supabase
        .from("invite_codes")
        .select("id", { count: "exact", head: true })
        .eq("code", code);
      if ((count ?? 0) > 0) {
        toast.error("Code already exists. Generating a new one…");
        continue;
      }
      const { error } = await supabase.from("invite_codes").insert({
        code,
        email: genEmail.trim() ? genEmail.trim().toLowerCase() : null,
        note: genNote.trim() ? genNote.trim() : null,
        max_uses: max,
        expires_at: genExpires ? new Date(genExpires).toISOString() : null,
        created_by: user?.id ?? null,
      });
      if (error) {
        if (error.code === "23505") {
          toast.error("Code already exists. Generating a new one…");
          continue;
        }
        lastError = error.message;
        break;
      }
      success = true;
      break;
    }
    setGenerating(false);
    if (!success) {
      toast.error(lastError ?? "Failed to generate unique code. Try again.");
      return;
    }
    setLastCode(code);
    setGenEmail(""); setGenExpires(""); setGenMaxUses("1"); setGenNote("");
    await loadInvites();
    setTimeout(() => {
      const el = document.getElementById("admin-last-code-input") as HTMLInputElement | null;
      el?.select();
    }, 50);
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied((c) => (c === text ? null : c)), 1500);
  };

  const statusOf = (r: InviteRow): { label: string; cls: string } => {
    if (r.expires_at && new Date(r.expires_at) < new Date()) return { label: "Expired", cls: "text-destructive" };
    if (r.use_count >= r.max_uses) return { label: "Used", cls: "text-muted-foreground" };
    return { label: "Active", cls: "text-emerald-700 dark:text-emerald-400" };
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("invite_codes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Invite code revoked.");
    setRevokeId(null);
    await loadInvites();
  };

  const updateSignerRole = async (userId: string, role: SignerRoleValue) => {
    setSignerSaving(userId);
    const { error } = await supabase.rpc("admin_set_signer_role", { p_user_id: userId, p_role: role });
    setSignerSaving(null);
    if (error) { toast.error(error.message); return; }
    setSignerRoles((rows) => rows.map((r) => (r.id === userId ? { ...r, signer_role: role } : r)));
    toast.success("Signer role updated.");
  };

  const filteredSignerRoles = signerRoles.filter((r) => {
    if (!signerSearch.trim()) return true;
    const q = signerSearch.trim().toLowerCase();
    return (
      (r.full_name ?? "").toLowerCase().includes(q) ||
      (r.contributor_id ?? "").toLowerCase().includes(q) ||
      (r.organisation ?? "").toLowerCase().includes(q)
    );
  });

  const summary = (() => {
    const total = invites.length;
    const redeemed = invites.filter((i) => i.use_count > 0 || i.used_at).length;
    const domains = new Map<string, number>();
    for (const i of invites) {
      if (!i.email || !(i.use_count > 0 || i.used_at)) continue;
      const d = i.email.split("@")[1];
      if (!d) continue;
      domains.set(d, (domains.get(d) ?? 0) + 1);
    }
    let topDomain: { domain: string; n: number } | null = null;
    for (const [domain, n] of domains) {
      if (!topDomain || n > topDomain.n) topDomain = { domain, n };
    }
    return { total, redeemed, topDomain };
  })();

  if (authorised === null) return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  if (!authorised) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <ShieldCheck className="h-8 w-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Admin access required.</p>
      <Button variant="outline" size="sm" onClick={() => navigate("/")}>Back</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h1 className="text-sm font-semibold">Admin</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Invite codes</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div
              className="grid grid-cols-3 gap-3"
              style={{
                border: "1px solid rgba(26,22,14,0.10)",
                borderRadius: 5,
                background: "#FDFAF4",
                padding: 14,
              }}
            >
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: "#9A8F84" }}>Codes generated</div>
                <div className="font-mono text-[14px] mt-1" style={{ color: "#1A1614" }}>{summary.total}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: "#9A8F84" }}>Redeemed</div>
                <div className="font-mono text-[14px] mt-1" style={{ color: "#2A6A45" }}>{summary.redeemed}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide" style={{ color: "#9A8F84" }}>Top email domain</div>
                <div className="font-mono text-[11px] mt-1" style={{ color: "#1A1614" }}>
                  {summary.topDomain ? `@${summary.topDomain.domain} · ${summary.topDomain.n} signups` : "—"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Lock to email (optional)</label>
                <Input value={genEmail} onChange={(e) => setGenEmail(e.target.value)} placeholder="user@example.com" type="email" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Expires</label>
                <Input value={genExpires} onChange={(e) => setGenExpires(e.target.value)} type="date" className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Max uses</label>
                <Input value={genMaxUses} onChange={(e) => setGenMaxUses(e.target.value)} type="number" min={1} className="h-9 text-xs" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">Memo</label>
                <Input value={genNote} onChange={(e) => setGenNote(e.target.value)} placeholder="Who this is for" className="h-9 text-xs" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating…" : "Generate code →"}
              </Button>
              {lastCode && (
                <div className="flex-1 flex items-center justify-between gap-3 px-3 py-2 rounded bg-muted">
                  <div>
                    <input
                      id="admin-last-code-input"
                      readOnly
                      value={lastCode}
                      onFocus={(e) => e.currentTarget.select()}
                      className="font-mono text-sm bg-transparent border-none p-0 focus:outline-none"
                      style={{ width: "100%" }}
                    />
                    <div className="font-mono text-[9px] text-muted-foreground mt-0.5">Code generated. Share this with the invitee.</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copy(lastCode)}>
                    {copied === lastCode ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2">Code</th>
                    <th className="text-left">Email</th>
                    <th className="text-left">Note</th>
                    <th className="text-right">Uses</th>
                    <th className="text-right">Expires</th>
                    <th className="text-right">Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invites.length === 0 && (
                    <tr><td colSpan={7} className="py-3 text-muted-foreground text-center">No invite codes yet.</td></tr>
                  )}
                  {invites.map((r) => {
                    const s = statusOf(r);
                    return (
                      <tr key={r.id} className="border-b">
                        <td className="py-2 font-mono text-[11px]">{r.code}</td>
                        <td className="font-mono text-[11px]">{r.email ?? "—"}</td>
                        <td className="font-mono text-[11px]">{r.note ?? "—"}</td>
                        <td className="text-right font-mono text-[11px]">{r.use_count}/{r.max_uses}</td>
                        <td className="text-right font-mono text-[11px]">{r.expires_at ? new Date(r.expires_at).toLocaleDateString() : "—"}</td>
                        <td className={`text-right font-mono text-[11px] ${s.cls}`}>{s.label}</td>
                        <td className="text-right whitespace-nowrap">
                          {revokeId === r.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="text-[12px]">Revoke this code?</span>
                              <button
                                onClick={() => revoke(r.id)}
                                className="font-mono text-[9px] px-2 py-0.5 rounded"
                                style={{ color: "#9A3020", border: "1px solid rgba(154,48,32,0.25)", background: "transparent" }}
                              >Confirm</button>
                              <button
                                onClick={() => setRevokeId(null)}
                                className="font-mono text-[9px] px-2 py-0.5"
                                style={{ color: "#9A8F84", background: "transparent", border: "none" }}
                              >Cancel</button>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(r.code)} title="Copy code">
                                {copied === r.code ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <button
                                onClick={() => setRevokeId(r.id)}
                                className="font-mono text-[9px] px-2 py-0.5 rounded"
                                style={{ color: "#9A3020", border: "1px solid rgba(154,48,32,0.25)", background: "transparent" }}
                              >Revoke</button>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats && (
            <>
              <Stat label="Users" value={String(stats.total_users)} />
              <Stat label="Active 30d" value={String(stats.active_users_30d)} />
              <Stat label="Contracts" value={String(stats.total_contracts)} />
              <Stat label="Executions" value={String(stats.total_executions)} />
              <Stat label="Received value" value={Number(stats.total_settled_value).toLocaleString()} />
            </>
          )}
        </section>

        <Card>
          <CardHeader><CardTitle className="text-sm">Contributors</CardTitle></CardHeader>
          <CardContent>
            <div className="text-[11px] text-muted-foreground mb-2">Counts only — contract contents are private.</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2">Contributor</th>
                    <th className="text-left">Sector</th>
                    <th className="text-right">Contracts</th>
                    <th className="text-right">Executions</th>
                    <th className="text-right">Last active</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-2">
                        <div className="font-medium">{u.anonymised ? <span className="italic text-muted-foreground">Contributor {u.contributor_id}</span> : (u.full_name ?? "—")}</div>
                        <div className="font-mono text-[10px] text-muted-foreground">{u.contributor_id}</div>
                      </td>
                      <td>{u.sector ?? "—"}</td>
                      <td className="text-right">{u.contract_count}</td>
                      <td className="text-right">{u.execution_count}</td>
                      <td className="text-right">{u.last_active ? new Date(u.last_active).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Signer roles</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="text-[11px] text-muted-foreground">
              Set each contributor's evidence sign-off level. Server-enforced — viewers cannot sign off even if they switch the UI role.
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={signerSearch}
                onChange={(e) => setSignerSearch(e.target.value)}
                placeholder="Search by name, contributor ID, or organisation"
                className="h-9 text-xs max-w-sm"
              />
              <div className="font-mono text-[10px] text-muted-foreground">
                {filteredSignerRoles.length} of {signerRoles.length}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b">
                    <th className="text-left py-2">Contributor</th>
                    <th className="text-left">Organisation</th>
                    <th className="text-left">Current role</th>
                    <th className="text-right">Set role</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSignerRoles.length === 0 && (
                    <tr><td colSpan={4} className="py-3 text-muted-foreground text-center">No contributors match.</td></tr>
                  )}
                  {filteredSignerRoles.map((r) => {
                    const saving = signerSaving === r.id;
                    return (
                      <tr key={r.id} className="border-b">
                        <td className="py-2">
                          <div className="font-medium">{r.full_name ?? "—"}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{r.contributor_id ?? "—"}</div>
                        </td>
                        <td className="font-mono text-[11px]">{r.organisation ?? "—"}</td>
                        <td className="font-mono text-[11px] capitalize">{r.signer_role}</td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-1">
                            {(["viewer", "reviewer", "approver"] as SignerRoleValue[]).map((role) => {
                              const active = r.signer_role === role;
                              return (
                                <Button
                                  key={role}
                                  variant={active ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 px-2 text-[11px] capitalize"
                                  disabled={active || saving}
                                  onClick={() => updateSignerRole(r.id, role)}
                                >
                                  {role}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle></CardHeader>
    <CardContent><div className="text-xl font-semibold">{value}</div></CardContent>
  </Card>
);

export default Admin;