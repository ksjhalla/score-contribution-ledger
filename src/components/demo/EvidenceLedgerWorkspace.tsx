import { useMemo, useRef, useState } from "react";
import type { EvidenceMapping, DemoProfile } from "@/data/demoProfiles";
import { formatDemoAmount } from "@/data/demoProfiles";
import { EvidenceLedgerWorkflow } from "./EvidenceLedgerWorkflow";
import { Upload, FileText, Smartphone, CheckCircle2, Clock, Eye, AlertTriangle, User, History, ShieldCheck, UserCheck, Lock, Download, FileSpreadsheet, FileDown } from "lucide-react";

const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
  kind: "create" | "approve" | "edit" | "watch";
};

type Role = "Viewer" | "Reviewer" | "Approver";

type SignOffState = {
  reviewer?: { actor: string; at: string };
  approver?: { actor: string; at: string };
};

const ROLE_META: Record<Role, { color: string; icon: typeof Eye; blurb: string }> = {
  Viewer: { color: "#5C5248", icon: Eye, blurb: "Read-only — cannot move mappings" },
  Reviewer: { color: "#2A5C8A", icon: UserCheck, blurb: "Can sign off evidence into Awaiting sign-off" },
  Approver: { color: "#2A6A45", icon: ShieldCheck, blurb: "Can counter-sign and reconcile to the ledger" },
};

const ROLE_ACTORS: Record<Role, string> = {
  Viewer: "Observer · viewer",
  Reviewer: "SGS Ghana · reviewer",
  Approver: "Concession trustee · approver",
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const STATUS_META: Record<EvidenceMapping["status"], { color: string; icon: typeof Clock; label: string }> = {
  Reconciled: { color: "#2A6A45", icon: CheckCircle2, label: "Reconciled" },
  "Awaiting sign-off": { color: "#C4892A", icon: Clock, label: "Awaiting sign-off" },
  Watching: { color: "#2A5C8A", icon: Eye, label: "Watching" },
};

export const EvidenceLedgerWorkspace = ({
  profile,
  initialMappings,
}: {
  profile: DemoProfile;
  initialMappings: EvidenceMapping[];
}) => {
  const accent = profile.accent;
  const [mappings, setMappings] = useState<EvidenceMapping[]>(initialMappings);
  const [role, setRole] = useState<Role>("Reviewer");
  const [signOff, setSignOff] = useState<Record<number, SignOffState>>(() => {
    const seed: Record<number, SignOffState> = {};
    initialMappings.forEach((m, i) => {
      if (m.status === "Reconciled") {
        seed[i] = {
          reviewer: { actor: ROLE_ACTORS.Reviewer, at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString() },
          approver: { actor: ROLE_ACTORS.Approver, at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
        };
      } else if (m.status === "Awaiting sign-off") {
        seed[i] = {
          reviewer: { actor: ROLE_ACTORS.Reviewer, at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() },
        };
      }
    });
    return seed;
  });
  const [audit, setAudit] = useState<AuditEvent[]>(() => [
    {
      id: "a1",
      at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
      actor: "SGS Ghana · auditor",
      action: "Approved",
      detail: "Q4 2025 kWh audit signed and reconciled to Volta Mini-Grid Concession",
      kind: "approve",
    },
    {
      id: "a2",
      at: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
      actor: "Concession trustee",
      action: "Approved",
      detail: "MTN MoMo + Vodafone Cash collection log reconciled — 94.6%",
      kind: "approve",
    },
    {
      id: "a3",
      at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      actor: "Independent technical auditor",
      action: "Edited",
      detail: "Uptime audit moved to Awaiting sign-off (99.2% confirmed)",
      kind: "edit",
    },
  ]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadKind, setUploadKind] = useState<"kWh audit" | "Mobile-money collection">("kWh audit");
  const [pulseId, setPulseId] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10);
  const [exportFrom, setExportFrom] = useState<string>(monthAgo);
  const [exportTo, setExportTo] = useState<string>(today);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const counts = useMemo(() => {
    const out = { Reconciled: 0, "Awaiting sign-off": 0, Watching: 0 } as Record<EvidenceMapping["status"], number>;
    mappings.forEach((m) => (out[m.status] += 1));
    return out;
  }, [mappings]);

  const blockers = useMemo(() => {
    const paidAwaiting = mappings.filter((m) => m.ledger.bucket === "Paid" && m.status !== "Reconciled");
    const pendingAwaiting = mappings.filter((m) => m.ledger.bucket === "Pending" && m.status !== "Reconciled");
    return { paidAwaiting, pendingAwaiting };
  }, [mappings]);

  const inRangeAudit = useMemo(() => {
    const start = new Date(exportFrom + "T00:00:00").getTime();
    const end = new Date(exportTo + "T23:59:59").getTime();
    return audit.filter((e) => {
      const t = new Date(e.at).getTime();
      return t >= start && t <= end;
    });
  }, [audit, exportFrom, exportTo]);

  const flashToast = (msg: string) => {
    setExportToast(msg);
    setTimeout(() => setExportToast(null), 2400);
  };

  const downloadBlob = (filename: string, mime: string, content: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const csvEscape = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push(`SCORE Evidence Ledger Audit Report`);
    lines.push(`Contributor,${csvEscape(profile.contributor.name)},${csvEscape(profile.contributor.id)}`);
    lines.push(`Range,${exportFrom},${exportTo}`);
    lines.push(`Generated,${new Date().toISOString()}`);
    lines.push("");
    lines.push("# Evidence mappings");
    lines.push(["Status","Bucket","Evidence type","Evidence title","Period","Source","Fingerprint","Metric","Ledger entry","Amount","Currency","Contract","Reviewer","Reviewer at","Approver","Approver at","Rule"].join(","));
    mappings.forEach((m, i) => {
      const so = signOff[i];
      lines.push([
        m.status, m.ledger.bucket, m.evidence.type, m.evidence.title, m.evidence.period,
        m.evidence.source, m.evidence.fingerprint, m.evidence.metric,
        m.ledger.entry, m.ledger.amount ?? "", m.ledger.currency, m.ledger.contract,
        so?.reviewer?.actor ?? "", so?.reviewer?.at ?? "",
        so?.approver?.actor ?? "", so?.approver?.at ?? "",
        m.rule,
      ].map(csvEscape).join(","));
    });
    lines.push("");
    lines.push(`# Audit trail (${exportFrom} -> ${exportTo})`);
    lines.push(["Timestamp","Actor","Action","Kind","Detail"].join(","));
    inRangeAudit.forEach((e) => {
      lines.push([e.at, e.actor, e.action, e.kind, e.detail].map(csvEscape).join(","));
    });
    const fname = `SCORE-${profile.contributor.id}-evidence-${exportFrom}_${exportTo}.csv`;
    downloadBlob(fname, "text/csv;charset=utf-8", lines.join("\n"));
    flashToast(`CSV exported · ${mappings.length} mappings, ${inRangeAudit.length} audit events`);
  };

  const exportPdf = () => {
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const rowsM = mappings
      .map((m, i) => {
        const so = signOff[i];
        return `<tr>
          <td>${esc(m.status)}</td>
          <td>${esc(m.ledger.bucket)}</td>
          <td>${esc(m.evidence.title)}<br/><span class="muted">${esc(m.evidence.period)} · ${esc(m.evidence.source)}</span></td>
          <td>${esc(m.ledger.entry)}<br/><span class="muted">${esc(m.ledger.contract)}</span></td>
          <td>${m.ledger.amount !== null ? formatDemoAmount(m.ledger.amount, m.ledger.currency) : "—"}</td>
          <td>${so?.reviewer ? esc(so.reviewer.actor) : "—"}<br/><span class="muted">${so?.reviewer ? new Date(so.reviewer.at).toLocaleString() : ""}</span></td>
          <td>${so?.approver ? esc(so.approver.actor) : "—"}<br/><span class="muted">${so?.approver ? new Date(so.approver.at).toLocaleString() : ""}</span></td>
        </tr>`;
      })
      .join("");
    const rowsA = inRangeAudit
      .map(
        (e) => `<tr>
          <td>${new Date(e.at).toLocaleString()}</td>
          <td>${esc(e.actor)}</td>
          <td><strong>${esc(e.action)}</strong></td>
          <td>${esc(e.detail)}</td>
        </tr>`
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>SCORE Evidence Audit Report</title>
      <style>
        body{font-family:'DM Sans',system-ui,sans-serif;color:#1A1614;padding:32px;}
        h1{font-family:'Playfair Display',Georgia,serif;font-size:22px;margin:0 0 4px;}
        h2{font-family:'Playfair Display',Georgia,serif;font-size:15px;margin:24px 0 8px;}
        .muted{color:#5C5248;font-size:10px;}
        .meta{font-size:11px;color:#5C5248;margin-bottom:16px;}
        table{width:100%;border-collapse:collapse;font-size:10px;}
        th{text-align:left;background:#F5EFE3;padding:6px;border-bottom:1px solid #ccc;font-weight:600;}
        td{padding:6px;border-bottom:1px solid #eee;vertical-align:top;}
        @media print {.no-print{display:none;}}
        .btn{display:inline-block;background:#1A1614;color:#fff;padding:8px 14px;border-radius:4px;text-decoration:none;font-size:12px;}
      </style></head><body>
      <div class="no-print" style="margin-bottom:16px;"><a class="btn" href="javascript:window.print()">Save as PDF</a></div>
      <h1>SCORE — Evidence Ledger Audit Report</h1>
      <div class="meta">
        Contributor: <strong>${esc(profile.contributor.name)}</strong> · ${esc(profile.contributor.id)}<br/>
        Range: ${esc(exportFrom)} → ${esc(exportTo)} · Generated ${new Date().toLocaleString()}<br/>
        ${mappings.length} mappings · ${inRangeAudit.length} audit events in range
      </div>
      <h2>Evidence mappings</h2>
      <table><thead><tr><th>Status</th><th>Bucket</th><th>Evidence</th><th>Ledger entry</th><th>Amount</th><th>Reviewer</th><th>Approver</th></tr></thead><tbody>${rowsM}</tbody></table>
      <h2>Audit trail</h2>
      <table><thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Detail</th></tr></thead><tbody>${rowsA || '<tr><td colspan="4" class="muted">No audit events in selected range.</td></tr>'}</tbody></table>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) {
      flashToast("Pop-up blocked — allow pop-ups to export PDF");
      return;
    }
    w.document.write(html);
    w.document.close();
    flashToast(`PDF view opened · click "Save as PDF" to download`);
  };

  const triggerUpload = (kind: "kWh audit" | "Mobile-money collection") => {
    setUploadKind(kind);
    fileInputRef.current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith(".csv") || uploadKind === "Mobile-money collection";
    const id = `up-${Date.now()}`;
    const fp = `${file.name} · ${file.size.toString(16)}…`;
    const newMapping: EvidenceMapping = {
      evidence: {
        type: uploadKind,
        title: isCsv
          ? `Mobile-money log · ${file.name}`
          : `Audited kWh sales · ${file.name}`,
        source: isCsv ? "Telco settlement upload (pending trustee review)" : "Operator upload (pending auditor sign-off)",
        period: "New upload · awaiting period tagging",
        fingerprint: fp,
        metric: isCsv ? "Awaiting reconciliation" : "Awaiting kWh tally",
      },
      ledger: {
        bucket: "Pending",
        entry: isCsv ? "Provisional collection adjustment" : "Provisional tariff revenue distribution",
        amount: null,
        currency: "USD",
        contract: "Volta Mini-Grid Concession · 2024–2044",
      },
      rule: isCsv
        ? "Provisional — collection rate confirmed once trustee counter-signs telco files"
        : "Provisional — released once independent meter auditor counter-signs",
      status: "Awaiting sign-off",
    };
    setMappings((prev) => [newMapping, ...prev]);
    setSignOff((prev) => {
      const next: Record<number, SignOffState> = {};
      Object.entries(prev).forEach(([k, v]) => {
        next[Number(k) + 1] = v;
      });
      return next;
    });
    setAudit((prev) => [
      {
        id,
        at: new Date().toISOString(),
        actor: `${profile.contributor.name} · ${profile.contributor.id}`,
        action: "Uploaded",
        detail: `${uploadKind} — ${file.name} (${(file.size / 1024).toFixed(1)} KB) → Pending mapping created`,
        kind: "create",
      },
      ...prev,
    ]);
    setPulseId(id);
    setTimeout(() => setPulseId(null), 1800);
    e.target.value = "";
  };

  const signAs = (idx: number) => {
    const m = mappings[idx];
    if (!m || role === "Viewer") return;
    const current = signOff[idx] ?? {};
    const now = new Date().toISOString();
    const actor = ROLE_ACTORS[role];

    if (role === "Reviewer") {
      if (current.reviewer) return;
      setSignOff((prev) => ({ ...prev, [idx]: { ...current, reviewer: { actor, at: now } } }));
      setMappings((prev) => prev.map((x, i) => (i === idx ? { ...x, status: "Awaiting sign-off" } : x)));
      setAudit((prev) => [
        {
          id: `rv-${Date.now()}`,
          at: now,
          actor,
          action: "Reviewer signed",
          detail: `${m.evidence.title} → moved to Awaiting sign-off (needs Approver)`,
          kind: "edit",
        },
        ...prev,
      ]);
      return;
    }

    if (!current.reviewer || current.approver) return;
    setSignOff((prev) => ({ ...prev, [idx]: { ...current, approver: { actor, at: now } } }));
    setMappings((prev) => prev.map((x, i) => (i === idx ? { ...x, status: "Reconciled" } : x)));
    setAudit((prev) => [
      {
        id: `ap-${Date.now()}`,
        at: now,
        actor,
        action: "Approver counter-signed",
        detail: `${m.evidence.title} → Reconciled to ${m.ledger.entry} (${m.ledger.bucket})`,
        kind: "approve",
      },
      ...prev,
    ]);
  };

  const jumpToContributor = () => {
    const el = document.getElementById("demo-contributor-anchor");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section style={{ marginBottom: 28, fontFamily: FONT_BODY }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.csv"
        onChange={onFile}
        style={{ display: "none" }}
      />

      {/* Upload bar */}
      <div
        style={{
          border: `1px dashed ${accent}55`,
          background: "#FDFAF4",
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 14,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Upload size={16} color={accent} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1614" }}>
              Attach audited evidence
            </div>
            <div style={{ fontSize: 11, color: "#5C5248", marginTop: 2 }}>
              kWh PDFs and mobile-money CSVs become a Pending ledger mapping until counter-signed.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => triggerUpload("kWh audit")}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: accent,
              background: `${accent}14`,
              border: `1px solid ${accent}33`,
              padding: "6px 10px",
              borderRadius: 4,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <FileText size={12} /> Upload kWh PDF
          </button>
          <button
            type="button"
            onClick={() => triggerUpload("Mobile-money collection")}
            style={{
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: "#2A5C8A",
              background: "rgba(42,92,138,0.08)",
              border: "1px solid rgba(42,92,138,0.25)",
              padding: "6px 10px",
              borderRadius: 4,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Smartphone size={12} /> Upload MoMo CSV
          </button>
        </div>
      </div>

      {/* Role switcher */}
      <div
        style={{
          border: "1px solid rgba(26,22,14,0.10)",
          background: "#FDFAF4",
          borderRadius: 6,
          padding: "12px 14px",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <ShieldCheck size={14} color={accent} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Acting as
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: ROLE_META[role].color, marginLeft: "auto" }}>
            {ROLE_META[role].blurb}
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(Object.keys(ROLE_META) as Role[]).map((r) => {
            const active = r === role;
            const meta = ROLE_META[r];
            const Icon = meta.icon;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: 10,
                  color: active ? "#FDFAF4" : meta.color,
                  background: active ? meta.color : `${meta.color}14`,
                  border: `1px solid ${meta.color}${active ? "" : "33"}`,
                  padding: "6px 10px",
                  borderRadius: 4,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Icon size={12} /> {r}
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: "#5C5248", marginTop: 10, lineHeight: 1.5 }}>
          Two-step gating: <strong>Reviewer</strong> moves new evidence into <em>Awaiting sign-off</em>.{" "}
          <strong>Approver</strong> counter-signs to reconcile. The Approver button is locked until a Reviewer signs.
        </div>
      </div>

      {/* Reconciliation panel */}
      <div
        style={{
          border: "1px solid rgba(26,22,14,0.10)",
          borderRadius: 6,
          background: "#FDFAF4",
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 9,
              color: "#9A8F84",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Reconciliation
          </span>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#5C5248" }}>
            {mappings.length} mappings tracked
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" style={{ marginBottom: 10 }}>
          {(["Reconciled", "Awaiting sign-off", "Watching"] as const).map((s) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            return (
              <div
                key={s}
                style={{
                  border: `1px solid ${meta.color}33`,
                  background: `${meta.color}10`,
                  borderRadius: 5,
                  padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon size={13} color={meta.color} />
                  <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: meta.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {meta.label}
                  </span>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 22, color: meta.color, marginTop: 4 }}>
                  {counts[s]}
                </div>
              </div>
            );
          })}
        </div>

        {(blockers.paidAwaiting.length > 0 || blockers.pendingAwaiting.length > 0) && (
          <div style={{ borderTop: "1px solid rgba(26,22,14,0.08)", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={12} color="#C4892A" />
              <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Blocking ledger movement
              </span>
            </div>
            {blockers.paidAwaiting.map((m, i) => {
              const idx = mappings.indexOf(m);
              return (
                <BlockerRow
                  key={`pa-${i}`}
                  bucket="Paid"
                  bucketColor="#2A6A45"
                  evidenceTitle={m.evidence.title}
                  status={m.status}
                  amount={formatDemoAmount(m.ledger.amount, m.ledger.currency)}
                  onSign={() => signAs(idx)}
                  role={role}
                  signOff={signOff[idx]}
                  pulse={pulseId !== null && mappings[0] === m && pulseId.startsWith("up-")}
                />
              );
            })}
            {blockers.pendingAwaiting.map((m, i) => {
              const idx = mappings.indexOf(m);
              return (
                <BlockerRow
                  key={`pe-${i}`}
                  bucket="Pending"
                  bucketColor="#C4892A"
                  evidenceTitle={m.evidence.title}
                  status={m.status}
                  amount={formatDemoAmount(m.ledger.amount, m.ledger.currency)}
                  onSign={() => signAs(idx)}
                  role={role}
                  signOff={signOff[idx]}
                  pulse={pulseId !== null && mappings[0] === m && pulseId.startsWith("up-")}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Contributor link */}
      <button
        type="button"
        onClick={jumpToContributor}
        style={{
          width: "100%",
          textAlign: "left",
          border: `1px solid ${accent}33`,
          background: `${accent}0a`,
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 14,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <User size={14} color={accent} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: "#1A1614" }}>
            Each mapping is attributed to <strong>{profile.contributor.name}</strong> ·{" "}
            <span style={{ fontFamily: FONT_MONO }}>{profile.contributor.id}</span>
          </div>
          <div style={{ fontSize: 11, color: "#5C5248", marginTop: 2 }}>
            Jump to passport stats — paid {formatDemoAmount(profile.stats.settled, profile.stats.currency)} ·{" "}
            pending {formatDemoAmount(profile.stats.pending, profile.stats.currency)} ·{" "}
            {profile.stats.contracts} contracts
          </div>
        </div>
        <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: accent }}>View →</span>
      </button>

      {/* Existing flow */}
      <EvidenceLedgerWorkflow mappings={mappings} accent={accent} />

      {/* Export panel */}
      <div
        style={{
          border: "1px solid rgba(26,22,14,0.10)",
          borderRadius: 6,
          background: "#FDFAF4",
          padding: 14,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <Download size={14} color={accent} />
          <h4 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, margin: 0, color: "#1A1614" }}>
            Export audit report
          </h4>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginLeft: "auto" }}>
            {mappings.length} mappings · {inRangeAudit.length} events in range
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 10 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>From</span>
            <input
              type="date"
              value={exportFrom}
              max={exportTo}
              onChange={(e) => setExportFrom(e.target.value)}
              style={{ fontFamily: FONT_MONO, fontSize: 11, padding: "6px 8px", border: "1px solid rgba(26,22,14,0.18)", borderRadius: 4, background: "#fff", color: "#1A1614" }}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", textTransform: "uppercase", letterSpacing: "0.06em" }}>To</span>
            <input
              type="date"
              value={exportTo}
              min={exportFrom}
              onChange={(e) => setExportTo(e.target.value)}
              style={{ fontFamily: FONT_MONO, fontSize: 11, padding: "6px 8px", border: "1px solid rgba(26,22,14,0.18)", borderRadius: 4, background: "#fff", color: "#1A1614" }}
            />
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
            <button
              type="button"
              onClick={exportCsv}
              style={{
                fontFamily: FONT_MONO, fontSize: 10, color: "#2A5C8A",
                background: "rgba(42,92,138,0.08)", border: "1px solid rgba(42,92,138,0.25)",
                padding: "8px 12px", borderRadius: 4, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <FileSpreadsheet size={12} /> Download CSV
            </button>
            <button
              type="button"
              onClick={exportPdf}
              style={{
                fontFamily: FONT_MONO, fontSize: 10, color: "#FDFAF4",
                background: accent, border: `1px solid ${accent}`,
                padding: "8px 12px", borderRadius: 4, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <FileDown size={12} /> Generate PDF
            </button>
          </div>
        </div>
        <div style={{ fontSize: 11, color: "#5C5248", lineHeight: 1.5 }}>
          CSV includes every mapping with Reviewer/Approver signatures. PDF opens a print-ready view of mappings plus the audit trail filtered to your selected range.
        </div>
        {exportToast && (
          <div style={{ marginTop: 10, fontFamily: FONT_MONO, fontSize: 10, color: "#2A6A45", background: "rgba(42,106,69,0.10)", border: "1px solid rgba(42,106,69,0.25)", padding: "6px 10px", borderRadius: 4 }}>
            {exportToast}
          </div>
        )}
      </div>

      {/* Audit trail */}
      <div
        style={{
          border: "1px solid rgba(26,22,14,0.10)",
          borderRadius: 6,
          background: "#FDFAF4",
          padding: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <History size={14} color={accent} />
          <h4 style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, margin: 0, color: "#1A1614" }}>
            Audit trail
          </h4>
          <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginLeft: "auto" }}>
            {audit.length} events
          </span>
        </div>
        <div style={{ position: "relative", paddingLeft: 14 }}>
          <div
            style={{
              position: "absolute",
              left: 4,
              top: 4,
              bottom: 4,
              width: 1,
              background: "rgba(26,22,14,0.12)",
            }}
          />
          {audit.map((ev) => {
            const dot =
              ev.kind === "approve" ? "#2A6A45" : ev.kind === "create" ? accent : ev.kind === "watch" ? "#2A5C8A" : "#C4892A";
            return (
              <div key={ev.id} style={{ position: "relative", marginBottom: 12 }}>
                <span
                  style={{
                    position: "absolute",
                    left: -14,
                    top: 4,
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dot,
                    border: "2px solid #FDFAF4",
                  }}
                />
                <div style={{ fontSize: 12, color: "#1A1614" }}>
                  <strong>{ev.action}</strong> · {ev.detail}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "#9A8F84", marginTop: 2 }}>
                  {ev.actor} · {fmtTime(ev.at)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const BlockerRow = ({
  bucket,
  bucketColor,
  evidenceTitle,
  status,
  amount,
  onSign,
  role,
  signOff,
  pulse,
}: {
  bucket: "Paid" | "Pending";
  bucketColor: string;
  evidenceTitle: string;
  status: EvidenceMapping["status"];
  amount: string;
  onSign: () => void;
  role: Role;
  signOff?: SignOffState;
  pulse: boolean;
}) => {
  const reviewerDone = !!signOff?.reviewer;
  const approverDone = !!signOff?.approver;

  let label = "Sign as Reviewer";
  let disabled = false;
  let actionColor = "#2A5C8A";
  let showLock = false;

  if (role === "Viewer") {
    label = "Read-only";
    disabled = true;
    actionColor = "#9A8F84";
    showLock = true;
  } else if (role === "Reviewer") {
    if (reviewerDone) {
      label = "Reviewer ✓";
      disabled = true;
    }
  } else {
    actionColor = "#2A6A45";
    if (!reviewerDone) {
      label = "Locked · needs Reviewer";
      disabled = true;
      actionColor = "#9A8F84";
      showLock = true;
    } else if (approverDone) {
      label = "Approved ✓";
      disabled = true;
    } else {
      label = "Counter-sign · reconcile";
    }
  }

  return (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 10px",
      borderRadius: 4,
      background: pulse ? `${bucketColor}1a` : "transparent",
      border: `1px solid ${bucketColor}22`,
      transition: "background 0.4s",
      flexWrap: "wrap",
    }}
  >
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 9,
        color: bucketColor,
        background: `${bucketColor}14`,
        border: `1px solid ${bucketColor}33`,
        padding: "2px 6px",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {bucket}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, color: "#1A1614", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {evidenceTitle}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84" }}>
        {amount} · Reviewer {reviewerDone ? "✓" : "○"} · Approver {approverDone ? "✓" : "○"}
      </div>
    </div>
    <button
      type="button"
      onClick={onSign}
      disabled={disabled}
      style={{
        fontFamily: FONT_MONO,
        fontSize: 9,
        color: actionColor,
        background: `${actionColor}14`,
        border: `1px solid ${actionColor}4d`,
        padding: "4px 8px",
        borderRadius: 3,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
        whiteSpace: "nowrap",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {showLock ? <Lock size={10} /> : null}
      {label}
    </button>
  </div>
  );
};
