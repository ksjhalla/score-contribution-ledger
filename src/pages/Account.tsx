import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DemoProfileCards } from "@/components/demo/DemoProfileCards";
import { PassportView, type PassportData } from "@/components/passport/PassportView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

type Profile = {
  id: string;
  full_name: string | null;
  professional_role: string | null;
  organisation: string | null;
  sector: string | null;
  contributor_id: string | null;
  created_at: string;
  passport_visible: boolean;
  show_contracts: boolean;
  show_counterparties: boolean;
  show_amounts: boolean;
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'DM Mono', ui-monospace, monospace";

const SectionHeading = ({ children, color = "#1A1614" }: { children: React.ReactNode; color?: string }) => (
  <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color, margin: "0 0 16px" }}>
    {children}
  </h2>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
    {children}
  </div>
);

const Value = ({ children, mono = false }: { children: React.ReactNode; mono?: boolean }) => (
  <div style={{ fontFamily: mono ? FONT_MONO : FONT_BODY, fontSize: 13, color: "#1A1614" }}>
    {children}
  </div>
);

const Account = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile edit
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editOrg, setEditOrg] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // URL copy
  const [copied, setCopied] = useState(false);

  // Export
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Print
  const [passportData, setPassportData] = useState<PassportData | null>(null);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);

  const passportUrl = useMemo(
    () => (profile?.contributor_id ? `${window.location.origin}/passport/${profile.contributor_id}` : ""),
    [profile?.contributor_id]
  );

  const reload = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, professional_role, organisation, sector, contributor_id, created_at, passport_visible, show_contracts, show_counterparties, show_amounts")
      .eq("id", user.id)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    reload().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load passport data lazily for print
  useEffect(() => {
    if (!profile?.contributor_id) return;
    supabase
      .rpc("get_public_passport", { p_contributor_id: profile.contributor_id })
      .then(({ data }) => setPassportData((data as PassportData) ?? null));
  }, [profile?.contributor_id, profile?.passport_visible, profile?.show_amounts, profile?.show_contracts, profile?.show_counterparties]);

  const startEdit = () => {
    if (!profile) return;
    setEditName(profile.full_name ?? "");
    setEditRole(profile.professional_role ?? "");
    setEditOrg(profile.organisation ?? "");
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editName.trim() || null,
        professional_role: editRole.trim() || null,
        organisation: editOrg.trim() || null,
      })
      .eq("id", user.id);
    setSavingProfile(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated.");
    setEditing(false);
    await reload();
  };

  const togglePrivacy = async (key: "passport_visible" | "show_contracts" | "show_counterparties" | "show_amounts", value: boolean) => {
    if (!user || !profile) return;
    setProfile({ ...profile, [key]: value });
    const update: Partial<Pick<Profile, "passport_visible" | "show_contracts" | "show_counterparties" | "show_amounts">> = { [key]: value };
    const { error } = await supabase.from("profiles").update(update).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      await reload();
    }
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(passportUrl);
    setCopied(true);
    toast.success("Passport URL copied.");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setExportError("Sign in required.");
        return;
      }
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!res.ok) {
        setExportError("Export failed. Try again.");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename =
        match?.[1] ?? `SCORE-${profile?.contributor_id ?? "export"}-${new Date().toISOString().slice(0, 10)}.json`;
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(dlUrl);
      toast.success("Record downloaded.");
    } catch {
      setExportError("Export failed. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const generatePdf = () => {
    document.body.classList.add("printing-passport");
    const cleanup = () => {
      document.body.classList.remove("printing-passport");
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 50);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.rpc("soft_delete_account");
    setDeleting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDeleteOpen(false);
    await signOut();
    navigate("/?deleted=true", { replace: true });
  };

  if (loading || !profile) {
    return (
      <div style={{ padding: 32, textAlign: "center", fontFamily: FONT_BODY, fontSize: 13, color: "#5C5248" }}>
        Loading…
      </div>
    );
  }

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : "—";

  const sectionStyle: React.CSSProperties = {
    padding: "28px 0",
    borderBottom: "1px solid rgba(26,22,14,0.08)",
  };

  const fieldRowStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "40% 60%",
    gap: 16,
    padding: "10px 0",
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid rgba(26,22,14,0.15)",
    borderRadius: 4,
    padding: "8px 10px",
    fontFamily: FONT_BODY,
    fontSize: 13,
    color: "#1A1614",
    background: "#FFFFFF",
  };

  const buttonOutline: React.CSSProperties = {
    border: "1px solid rgba(26,22,14,0.15)",
    background: "#FDFAF4",
    color: "#1A1614",
    fontFamily: FONT_MONO,
    fontSize: 10,
    borderRadius: 4,
    padding: "8px 16px",
    cursor: "pointer",
  };

  const linkBtn: React.CSSProperties = {
    fontFamily: FONT_MONO,
    fontSize: 10,
    color: "#C4892A",
    background: "none",
    border: "none",
    padding: 0,
    cursor: "pointer",
  };

  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto" }}>
      <div className="md:hidden" style={{ marginBottom: 24 }}>
        <DemoProfileCards fullWidth />
      </div>

      {/* SECTION 1: PROFILE */}
      <section style={sectionStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
          <SectionHeading>Profile</SectionHeading>
          {!editing && (
            <button onClick={startEdit} style={linkBtn}>Edit profile →</button>
          )}
        </div>

        {!editing ? (
          <div>
            <div style={fieldRowStyle}><Label>Contributor name</Label><Value>{profile.full_name ?? "—"}</Value></div>
            <div style={fieldRowStyle}><Label>Role</Label><Value>{profile.professional_role ?? "—"}</Value></div>
            <div style={fieldRowStyle}><Label>Organisation</Label><Value>{profile.organisation ?? "—"}</Value></div>
            <div style={fieldRowStyle}><Label>Sector</Label><Value>{profile.sector ?? "—"}</Value></div>
            <div style={fieldRowStyle}>
              <Label>Contributor ID</Label>
              <div>
                <Value mono>{profile.contributor_id ?? "Pending"}</Value>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
                  Permanent · cannot be changed
                </div>
              </div>
            </div>
            <div style={fieldRowStyle}><Label>Member since</Label><Value>{memberSince}</Value></div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Label>Contributor name</Label>
              <input style={inputStyle} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label>Role</Label>
              <input style={inputStyle} value={editRole} onChange={(e) => setEditRole(e.target.value)} maxLength={120} />
            </div>
            <div>
              <Label>Organisation</Label>
              <input style={inputStyle} value={editOrg} onChange={(e) => setEditOrg(e.target.value)} maxLength={120} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={saveProfile} disabled={savingProfile} style={{ ...buttonOutline, background: "#1A1614", color: "#F5F1E8", borderColor: "#1A1614" }}>
                {savingProfile ? "Saving…" : "Save"}
              </button>
              <button onClick={() => setEditing(false)} disabled={savingProfile} style={buttonOutline}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: PASSPORT VISIBILITY */}
      <section style={sectionStyle}>
        <SectionHeading>Passport visibility</SectionHeading>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(26,22,14,0.07)" }}>
          <div>
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "#1A1614" }}>Public passport</div>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
              Anyone with your passport URL can view your public profile.
            </div>
          </div>
          <Switch checked={profile.passport_visible} onCheckedChange={(v) => togglePrivacy("passport_visible", v)} />
        </div>

        {profile.passport_visible && profile.contributor_id && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginBottom: 6 }}>Your passport URL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{
                flex: 1, background: "#FFFFFF", border: "1px solid rgba(26,22,14,0.10)", borderRadius: 4,
                padding: "8px 12px", fontFamily: FONT_MONO, fontSize: 11, color: "#2A5C8A",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {passportUrl}
              </div>
              <button onClick={copyUrl} style={{
                background: "rgba(196,137,42,0.10)", color: "#C4892A", border: "none",
                borderRadius: 4, padding: "7px 12px", cursor: "pointer",
                fontFamily: FONT_MONO, fontSize: 10, fontWeight: 600, whiteSpace: "nowrap",
              }}>
                {copied ? "Copied ✓" : "Copy link"}
              </button>
            </div>
          </div>
        )}

        <div style={{ marginTop: 18 }}>
          {[
            { key: "show_contracts" as const, label: "Attribution records", desc: "Contribution names, types, and verified authorship" },
            { key: "show_counterparties" as const, label: "Contract names and counterparties", desc: "Which organisations you have agreements with" },
            { key: "show_amounts" as const, label: "Financial amounts", desc: "Settled and pending payment figures" },
          ].map((row) => (
            <div key={row.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid rgba(26,22,14,0.07)", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: "#1A1614" }}>{row.label}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>{row.desc}</div>
              </div>
              <Switch checked={!!profile[row.key]} onCheckedChange={(v) => togglePrivacy(row.key, v)} />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: DATA AND EXPORT */}
      <section style={sectionStyle}>
        <SectionHeading>Data and export</SectionHeading>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "#1A1614", marginBottom: 4 }}>
            Download your record
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", margin: "0 0 10px", lineHeight: 1.6, maxWidth: 560 }}>
            Download all your contracts, executions, and evidence fingerprints as a structured JSON file. This is your portable record — independent of this platform.
          </p>
          <button onClick={downloadExport} disabled={exporting} style={buttonOutline}>
            {exporting ? <><Loader2 className="inline h-3 w-3 animate-spin" style={{ marginRight: 6 }} />Preparing…</> : "Download record →"}
          </button>
          {exportError && (
            <div style={{ marginTop: 8, fontFamily: FONT_BODY, fontSize: 12, color: "#9A3020" }}>{exportError}</div>
          )}
        </div>

        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "#1A1614", marginBottom: 4 }}>
            Generate passport PDF
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", margin: "0 0 10px", lineHeight: 1.6, maxWidth: 560 }}>
            Generate a one-page PDF of your public passport. Structured as a professional credential document.
          </p>
          <button onClick={generatePdf} disabled={!passportData} style={{ ...buttonOutline, opacity: passportData ? 1 : 0.5 }}>
            Generate PDF →
          </button>
        </div>
      </section>

      {/* SECTION 4: DANGER ZONE */}
      <section style={{ paddingTop: 28 }}>
        <SectionHeading color="#9A3020">Danger zone</SectionHeading>
        <div style={{
          border: "1px solid rgba(154,48,32,0.20)",
          borderRadius: 6,
          padding: 20,
          background: "rgba(154,48,32,0.03)",
        }}>
          <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: "#1A1614", marginBottom: 4 }}>
            Delete account
          </div>
          <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5C5248", margin: "0 0 14px", lineHeight: 1.6 }}>
            Permanently removes your profile, contracts, executions, and personal data. Evidence fingerprint records are retained anonymised. Your Contributor ID is retired and never reissued. This cannot be undone.
          </p>
          <button
            onClick={() => { setDeleteInput(""); setDeleteOpen(true); }}
            style={{
              background: "rgba(154,48,32,0.08)",
              border: "1px solid rgba(154,48,32,0.3)",
              color: "#9A3020",
              fontFamily: FONT_MONO,
              fontSize: 10,
              borderRadius: 4,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Delete my account
          </button>
        </div>
      </section>

      {/* Hidden printable passport */}
      {passportData && (
        <div style={{ display: "none" }} className="print-only-passport">
          <PassportView data={passportData} />
        </div>
      )}
      <style>{`
        @media print {
          .print-only-passport { display: block !important; }
        }
      `}</style>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onOpenChange={(v) => { if (!deleting) setDeleteOpen(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600 }}>
              Are you sure?
            </DialogTitle>
            <DialogDescription style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#5C5248", lineHeight: 1.7 }}>
              This will permanently delete your account. Type your Contributor ID to confirm:
            </DialogDescription>
          </DialogHeader>
          <input
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            placeholder={profile.contributor_id ?? ""}
            style={{
              width: "100%",
              border: "1px solid rgba(26,22,14,0.15)",
              borderRadius: 4,
              padding: "10px 12px",
              fontFamily: FONT_MONO,
              fontSize: 13,
              color: "#1A1614",
              background: "#FFFFFF",
            }}
          />
          <DialogFooter style={{ flexDirection: "column", gap: 8, alignItems: "stretch" }}>
            <button
              onClick={confirmDelete}
              disabled={deleting || deleteInput !== profile.contributor_id || !profile.contributor_id}
              style={{
                background: "#9A3020",
                color: "#fff",
                border: "none",
                fontFamily: FONT_MONO,
                fontSize: 10,
                width: "100%",
                borderRadius: 4,
                padding: 10,
                cursor: deleteInput === profile.contributor_id ? "pointer" : "not-allowed",
                opacity: deleteInput === profile.contributor_id ? 1 : 0.5,
              }}
            >
              {deleting ? "Deleting…" : "Delete my account permanently"}
            </button>
            <button
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
              style={{ ...linkBtn, color: "#9A8F84", textAlign: "center", padding: 4 }}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Account;
