import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const SECTORS = [
  "Software", "Pharma & Biotech", "Agriculture", "Manufacturing",
  "Music & Publishing", "Film & Television", "AI & Data", "College Athletics", "Other",
] as const;

type Sector = typeof SECTORS[number];

const buildContributorId = (fullName: string, signupYear: number) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  let initials: string;
  if (parts.length === 0) {
    initials = "XX";
  } else if (parts.length === 1) {
    initials = (parts[0].slice(0, 2) || "X").toUpperCase().padEnd(2, "X");
  } else {
    const first = parts[0][0] ?? "X";
    const last = parts[parts.length - 1][0] ?? "X";
    initials = `${first}${last}`.toUpperCase();
  }
  return `SCR-${initials}-${signupYear}-001`;
};

const CompleteProfile = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [sector, setSector] = useState<Sector | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !sector) return;
    setBusy(true);
    const signupYear = new Date(user.created_at).getFullYear();
    const contributorId = buildContributorId(fullName, signupYear);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        professional_role: role.trim(),
        organisation: organisation.trim() || null,
        sector,
        contributor_id: contributorId,
        profile_completed: true,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Welcome, your Contributor ID is ${contributorId}`);
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>This information generates your permanent Contributor ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Professional role</Label>
              <Input id="role" required value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Organisation (optional)</Label>
              <Input id="org" value={organisation} onChange={(e) => setOrganisation(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={sector} onValueChange={(v) => setSector(v as Sector)}>
                <SelectTrigger id="sector"><SelectValue placeholder="Select a sector" /></SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={busy || !sector}>
              Generate Contributor ID
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;