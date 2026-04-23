import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, FileText } from "lucide-react";

type Profile = {
  full_name: string | null;
  professional_role: string | null;
  contributor_id: string | null;
  profile_completed: boolean;
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{value}</div>
    </CardContent>
  </Card>
);

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, professional_role, contributor_id, profile_completed")
        .eq("id", user.id)
        .maybeSingle();
      if (!data || !data.profile_completed) {
        navigate("/complete-profile", { replace: true });
        return;
      }
      setProfile(data);
      setProfileLoading(false);
    })();
  }, [user, loading, navigate]);

  if (loading || profileLoading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">SCORE</h1>
            <p className="text-xs text-muted-foreground">Contribution Ledger</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="passport" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="passport">Passport</TabsTrigger>
            <TabsTrigger value="log">Log Work</TabsTrigger>
          </TabsList>

          <TabsContent value="passport" className="space-y-6 mt-6">
            <Card>
              <CardContent className="pt-6 space-y-1">
                <div className="text-xl font-semibold">{profile.full_name}</div>
                <div className="text-sm text-muted-foreground">{profile.professional_role}</div>
                <div className="pt-2 text-xs font-mono text-muted-foreground">
                  {profile.contributor_id}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total attributed value" value="0" />
              <StatCard label="Settled" value="0" />
              <StatCard label="Pending" value="0" />
              <StatCard label="Contracts" value="0" />
            </div>
          </TabsContent>

          <TabsContent value="log" className="mt-6">
            <Card>
              <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-3">
                <div className="rounded-full bg-muted p-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="text-sm font-medium">No work logged yet</div>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Logging contributions will be available soon.
                </p>
                <Button disabled size="sm">Log a contribution</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
