import { useEffect, useMemo, useState } from "react";
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
  const [touched, setTouched] = useState<{ fullName?: boolean; role?: boolean; sector?: boolean }>({});

  useEffect(() => {
    if (!loading && !user) navigate("/auth", { replace: true });
  }, [user, loading, navigate]);

  const errors = useMemo(() => {
    const e: { fullName?: string; role?: string; organisation?: string; sector?: string } = {};
    const name = fullName.trim();
    if (!name) e.fullName = "Full name is required.";
    else if (name.length < 2) e.fullName = "Please enter at least 2 characters.";
    else if (name.length > 100) e.fullName = "Keep your name under 100 characters.";
    else if (!/\s/.test(name)) e.fullName = "Please enter your first and last name.";

    const r = role.trim();
    if (!r) e.role = "Professional role is required.";
    else if (r.length < 2) e.role = "Please enter at least 2 characters.";
    else if (r.length > 80) e.role = "Keep your role under 80 characters.";

    if (organisation.trim().length > 120) e.organisation = "Keep organisation under 120 characters.";

    if (!sector) e.sector = "Please select a sector.";
    return e;
  }, [fullName, role, organisation, sector]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ fullName: true, role: true, sector: true });
    if (!user || !isValid) {
      toast.error("Please fix the highlighted fields before continuing.");
      return;
    }
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
    <div className="min-h-screen flex items-center justify-center px-4 py-6 sm:py-8 bg-background">
      <Card className="w-full max-w-md sm:rounded-lg rounded-md shadow-sm">
        <CardHeader className="px-5 sm:px-6 pt-5 sm:pt-6">
          <CardTitle>Complete your profile</CardTitle>
          <CardDescription>This information generates your permanent Contributor ID.</CardDescription>
        </CardHeader>
        <CardContent className="px-5 sm:px-6 pb-5 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                autoComplete="name"
                inputMode="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                aria-invalid={!!(touched.fullName && errors.fullName)}
                aria-describedby={touched.fullName && errors.fullName ? "fullName-error" : undefined}
                className={touched.fullName && errors.fullName ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.fullName && errors.fullName && (
                <p id="fullName-error" className="text-xs text-destructive">{errors.fullName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Professional role</Label>
              <Input
                id="role"
                autoComplete="organization-title"
                placeholder="e.g. Research Scientist"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, role: true }))}
                aria-invalid={!!(touched.role && errors.role)}
                aria-describedby={touched.role && errors.role ? "role-error" : undefined}
                className={touched.role && errors.role ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {touched.role && errors.role && (
                <p id="role-error" className="text-xs text-destructive">{errors.role}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="org">Organisation <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input
                id="org"
                autoComplete="organization"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                aria-invalid={!!errors.organisation}
                aria-describedby={errors.organisation ? "org-error" : undefined}
                className={errors.organisation ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.organisation && (
                <p id="org-error" className="text-xs text-destructive">{errors.organisation}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select
                value={sector || undefined}
                onValueChange={(v) => {
                  setSector(v as Sector);
                  setTouched((t) => ({ ...t, sector: true }));
                }}
              >
                <SelectTrigger
                  id="sector"
                  aria-invalid={!!(touched.sector && errors.sector)}
                  className={touched.sector && errors.sector ? "border-destructive focus:ring-destructive" : ""}
                >
                  <SelectValue placeholder="Select a sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              {touched.sector && errors.sector && (
                <p className="text-xs text-destructive">{errors.sector}</p>
              )}
            </div>
            <Button type="submit" className="w-full h-11 sm:h-10" disabled={busy || !isValid}>
              {busy ? "Generating…" : "Generate Contributor ID"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Your Contributor ID is permanent and cannot be changed later.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;