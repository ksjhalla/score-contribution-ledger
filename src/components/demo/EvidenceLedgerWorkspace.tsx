import { useMemo, useRef, useState } from "react";
import type { EvidenceMapping, DemoProfile } from "@/data/demoProfiles";
import { formatDemoAmount } from "@/data/demoProfiles";
import { EvidenceLedgerWorkflow } from "./EvidenceLedgerWorkflow";
import { Upload, FileText, Smartphone, CheckCircle2, Clock, Eye, AlertTriangle, User, History } from "lucide-react";

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

  const approve = (idx: number) => {
    const m = mappings[idx];
    if (!m) return;
    setMappings((prev) => prev.map((x, i) => (i === idx ? { ...x, status: "Reconciled" } : x)));
    setAudit((prev) => [
      {
        id: `ap-${Date.now()}`,
        at: new Date().toISOString(),
        actor: `${profile.contributor.name} · ${profile.contributor.id}`,
        action: "Approved",
        detail: `${m.evidence.title} → ${m.ledger.entry} (${m.ledger.bucket})`,
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
                  onApprove={() => approve(idx)}
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
                  onApprove={() => approve(idx)}
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
  onApprove,
  pulse,
}: {
  bucket: "Paid" | "Pending";
  bucketColor: string;
  evidenceTitle: string;
  status: EvidenceMapping["status"];
  amount: string;
  onApprove: () => void;
  pulse: boolean;
}) => (
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
        Blocked by: {status} · {amount}
      </div>
    </div>
    <button
      type="button"
      onClick={onApprove}
      style={{
        fontFamily: FONT_MONO,
        fontSize: 9,
        color: "#2A6A45",
        background: "rgba(42,106,69,0.08)",
        border: "1px solid rgba(42,106,69,0.3)",
        padding: "4px 8px",
        borderRadius: 3,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      Mark reconciled
    </button>
  </div>
);
