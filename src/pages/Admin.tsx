import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type Stats = { total_contracts: number; total_executions: number; total_settled_value: number; total_users: number; active_users_30d: number };
type UserRow = { id: string; contributor_id: string | null; full_name: string | null; sector: string | null; created_at: string; anonymised: boolean; deleted_at: string | null; contract_count: number; execution_count: number; last_active: string | null };

const Admin = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [authorised, setAuthorised] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate("/auth", { replace: true }); return; }
    (async () => {
      const { data: roleRows } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      const isAdmin = (roleRows ?? []).length > 0;
      setAuthorised(isAdmin);
      if (!isAdmin) return;
      const [s, u] = await Promise.all([
        supabase.rpc("get_admin_stats"),
        supabase.rpc("get_admin_user_list"),
      ]);
      setStats(s.data as unknown as Stats);
      setUsers((u.data as unknown as UserRow[]) ?? []);
    })();
  }, [user, loading, navigate]);

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
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stats && (
            <>
              <Stat label="Users" value={String(stats.total_users)} />
              <Stat label="Active 30d" value={String(stats.active_users_30d)} />
              <Stat label="Contracts" value={String(stats.total_contracts)} />
              <Stat label="Executions" value={String(stats.total_executions)} />
              <Stat label="Settled value" value={Number(stats.total_settled_value).toLocaleString()} />
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