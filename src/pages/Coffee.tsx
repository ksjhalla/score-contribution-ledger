import { useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { trackEvent } from "@/lib/analytics";

const COLORS = {
  bg: "#F5F1E8",
  surface: "#EDE8DC",
  card: "#FDFAF4",
  text: "#1A1614",
  muted: "#5C5248",
  faint: "#9A8F84",
  amber: "#C4892A",
  dark: "#1A1614",
  darkText: "#F5F1E8",
  border: "rgba(26,22,14,0.10)",
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'DM Mono', ui-monospace, monospace";

const containerStyle: React.CSSProperties = { maxWidth: 920, margin: "0 auto", padding: "0 24px" };

const eyebrowStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: COLORS.faint,
  marginBottom: 12,
};

const emailSchema = z
  .string()
  .trim()
  .min(3)
  .max(255)
  .email({ message: "Please enter a valid email address." });

const contactSchema = z.object({
  name: z.string().trim().min(1, { message: "Please tell us your name." }).max(120),
  email: emailSchema,
  organisation: z.string().trim().max(160).optional(),
  use_case: z.string().trim().min(1, { message: "Please pick a use case." }).max(80),
  message: z.string().trim().max(2000).optional(),
});

const USE_CASES = [
  "Software & Open Source",
  "Pharma & Biotech",
  "College Athletics",
  "Music & Publishing",
  "Film & Television",
  "Agriculture",
  "Manufacturing",
  "AI Training Data",
  "Other",
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  const attach = (el: T | null) => {
    ref.current = el;
    if (!el || shown) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12 },
    );
    obs.observe(el);
  };
  return {
    attach,
    style: {
      opacity: shown ? 1 : 0,
      transform: shown ? "translateY(0)" : "translateY(16px)",
      transition: "opacity 0.5s ease, transform 0.5s ease",
    } as React.CSSProperties,
  };
}

function Section({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const { attach, style } = useReveal<HTMLElement>();
  return (
    <section ref={attach} {...rest} style={{ ...style, ...rest.style }}>
      {children}
    </section>
  );
}

const PROBLEM_CARDS = [
  {
    eyebrow: "THE GAP",
    h1: "Farmers see",
    em: "about 19.5%.",
    body: "A 2013 European Commission study found Kenyan coffee farmers captured roughly 19.5% of the Nairobi Coffee Exchange auction price — most of the value sits with millers, marketing agents, and exporters further up the chain.",
  },
  {
    eyebrow: "THE SHIFT",
    h1: "The law is",
    em: "changing the path.",
    body: "Kenya's Coffee Act 2025 introduces a Direct Settlement System meant to shorten that chain and route more value straight to farmers and cooperatives. It changes who gets paid — not whether anyone can see it happening.",
  },
  {
    eyebrow: "THE OPENING",
    h1: "Visibility is the",
    em: "missing layer.",
    body: "SCORE doesn't decide who gets paid what. It makes the payment chain visible to everyone standing in it — which is the precondition for a farmer, a cooperative, a lender, or a regulator to ask whether it's fair.",
  },
];

const STEPS = [
  { n: "01", t: "Delivery is scanned", b: "A QR scan at the cooperative wet mill records the delivery against the farmer's ID." },
  { n: "02", t: "The record is sealed", b: "Each entry is SHA-256 fingerprinted and RFC 3161 timestamped — tamper-evident from the moment it's created." },
  { n: "03", t: "It's linked to real prices", b: "Entries connect to Nairobi Coffee Exchange auction pricing and Coffee Research & Extension grade certificates, not estimates." },
  { n: "04", t: "Everyone sees their piece", b: "The farmer sees her wallet. The cooperative sees distribution. A lender, trader, brand, or the IFC sees exactly the slice relevant to them — nothing more." },
];

const PAYERS = [
  { tag: "FARMER & COOPERATIVE", title: "Nothing", body: "The people whose contribution is being recorded never pay to be recorded. The farmer keeps her record and carries it with her." },
  { tag: "TRADER", title: "Pays for compliance-grade traceability", body: "EUDR deforestation due diligence requires plot-level provenance. A trader already has to produce that evidence — SCORE makes it a by-product of paying farmers rather than a separate audit exercise." },
  { tag: "LENDER & BRAND", title: "Pay for verified data access", body: "A lender pays for a borrower record it can underwrite against. A brand pays for anonymised aggregate attribution data it can put into CSRD/ESRS reporting." },
];

const CHAIN = ["Farmer", "Cooperative", "Trader", "Brand", "Consumer"];
const ENABLERS = ["Lender (KCB, Equity, SACCOs)", "IFC / FAO / Nandi County"];

const pill = (label: string, accent = false): React.CSSProperties => ({
  display: "inline-block",
  background: accent ? "rgba(196,137,42,0.08)" : COLORS.card,
  border: `1px solid ${accent ? "rgba(196,137,42,0.35)" : COLORS.border}`,
  borderRadius: 999,
  padding: "8px 16px",
  fontFamily: FONT_BODY,
  fontSize: 13,
  color: accent ? COLORS.amber : COLORS.text,
});

export default function Coffee() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const [form, setForm] = useState({ name: "", email: "", organisation: "", use_case: "Agriculture", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof typeof form, string>>>({});

  const validateField = (key: keyof typeof form, value: string): string | undefined => {
    if (key === "name" && !value.trim()) return "Please enter your name.";
    if (key === "email") {
      if (!value.trim()) return "Please enter your email.";
      if (!emailSchema.safeParse(value).success) return "Please enter a valid email address.";
    }
    if (key === "use_case" && !value) return "Please select your use case.";
    return undefined;
  };

  const handleBlur = (key: keyof typeof form) => () =>
    setFieldErr((p) => ({ ...p, [key]: validateField(key, form[key]) }));

  const scrollToCta = (e?: React.MouseEvent) => {
    e?.preventDefault();
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => nameInputRef.current?.focus(), 600);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const fe: Partial<Record<keyof typeof form, string>> = {};
    (["name", "email", "use_case"] as const).forEach((k) => {
      const msg = validateField(k, form[k]);
      if (msg) fe[k] = msg;
    });
    if (Object.keys(fe).length) {
      setFieldErr(fe);
      const firstKey = (["name", "email", "use_case"] as const).find((k) => fe[k]);
      if (firstKey) {
        const el = fieldRefs.current[firstKey];
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => (el as HTMLInputElement | null)?.focus(), 350);
      }
      return;
    }
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      const fe2: Partial<Record<keyof typeof form, string>> = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof form;
        if (k && !fe2[k]) fe2[k] = i.message;
      });
      setFieldErr(fe2);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("demo_requests").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      organisation: parsed.data.organisation || null,
      use_case: parsed.data.use_case,
      message: parsed.data.message || null,
      source: "coffee_case_study",
    });
    setSubmitting(false);
    if (error) {
      setErr("Something went wrong. Email us at hello@score.xyz");
      trackEvent("demo_request_failed", { error: error.message });
      return;
    }
    trackEvent("demo_request_submitted", { use_case: parsed.data.use_case, source: "coffee_case_study" });
    setSubmittedName(parsed.data.name);
    setSubmitted(true);
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <SEO
        title="Coffee in Nandi County — SCORE case study"
        description="SCORE's coffee pilot with Kaptumo Cooperative in Nandi County, Kenya: making the value chain between a smallholder farmer and the auction visible, verifiable and portable."
        url="https://score-contribution-ledger.lovable.app/coffee"
      />
      <style>{`
        @media (max-width: 640px) {
          .coffee-h1 { font-size: 40px !important; }
          .coffee-cols-3 { grid-template-columns: 1fr !important; gap: 32px !important; }
          .coffee-cols-2 { grid-template-columns: 1fr !important; }
        }
        .coffee-link-underline:hover { text-decoration: underline; }
      `}</style>

      {/* TOPBAR */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(245,241,232,0.92)",
          backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(26,22,14,0.08)", height: 52,
        }}
      >
        <div style={{ ...containerStyle, height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.text, textDecoration: "none" }}>← SCORE</Link>
          <a
            href="#cta"
            onClick={scrollToCta}
            style={{
              background: COLORS.dark, color: COLORS.darkText,
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.06em",
              borderRadius: 4, padding: "9px 18px", textDecoration: "none",
            }}
          >
            REQUEST ACCESS
          </a>
        </div>
      </header>

      {/* HERO */}
      <Section id="hero" style={{ padding: "80px 0 90px" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <div style={{ ...eyebrowStyle, color: COLORS.amber, marginBottom: 20 }}>CASE STUDY · NANDI COUNTY, KENYA</div>
          <h1
            className="coffee-h1"
            style={{
              fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 64, lineHeight: 1.1,
              letterSpacing: "-0.02em", margin: "0 auto 26px", maxWidth: 780,
            }}
          >
            A coffee farmer's harvest,<br />
            <em style={{ fontStyle: "italic", color: COLORS.amber }}>tracked to the cent.</em>
          </h1>
          <p style={{ fontSize: 16, color: COLORS.muted, maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>
            SCORE is piloting with Kaptumo Cooperative in Nandi County, Kenya — proving that a smallholder farmer can
            see, and eventually earn from, the full value chain her coffee moves through after it leaves her hands.
          </p>
          <Link
            to="/?use_case=Agriculture#cta"
            style={{
              background: COLORS.dark, color: COLORS.darkText,
              fontSize: 14, fontWeight: 500, borderRadius: 4,
              padding: "13px 26px", textDecoration: "none", display: "inline-block",
            }}
          >
            Request access to the pilot →
          </Link>
        </div>
      </Section>

      {/* PROBLEM (dark) */}
      <Section id="problem" style={{ background: COLORS.dark, color: COLORS.darkText, padding: "80px 0" }}>
        <div style={containerStyle}>
          <div className="coffee-cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48 }}>
            {PROBLEM_CARDS.map((c) => (
              <div key={c.eyebrow}>
                <div style={{ ...eyebrowStyle, color: "rgba(245,241,232,0.5)", marginBottom: 16 }}>{c.eyebrow}</div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 32, lineHeight: 1.15, margin: "0 0 20px", color: COLORS.darkText }}>
                  {c.h1}<br />
                  <em style={{ fontStyle: "italic", color: COLORS.amber }}>{c.em}</em>
                </h2>
                <p style={{ fontSize: 13, color: "rgba(245,241,232,0.6)", lineHeight: 1.7, margin: 0 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW THE PILOT WORKS */}
      <Section id="how" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={{ ...containerStyle, maxWidth: 880 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={eyebrowStyle}>HOW THE PILOT WORKS</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: "0 0 14px" }}>
              From the wet mill<br /><em style={{ fontStyle: "italic", color: COLORS.text }}>to the auction sheet.</em>
            </h2>
            <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Four steps, each one anchored to evidence someone else published.
            </p>
          </div>
          <div className="coffee-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "24px 26px" }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.amber, marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.7 }}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* THE CHAIN */}
      <Section id="chain" style={{ background: COLORS.bg, padding: "80px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <div style={eyebrowStyle}>THE CHAIN</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: "0 0 14px" }}>
            Five hands, <em style={{ fontStyle: "italic", color: COLORS.text }}>one bag of coffee.</em>
          </h2>
          <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 560, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Every stakeholder in the chain sees the same record from a different angle — and only the slice that concerns
            them. The pilot sandbox has a working view for each one.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 10, maxWidth: 760, margin: "0 auto" }}>
            {CHAIN.map((label, i) => (
              <span key={label} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={pill(label)}>{label}</span>
                {i < CHAIN.length - 1 && <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.faint }}>→</span>}
              </span>
            ))}
          </div>
          <div style={{ ...eyebrowStyle, marginTop: 28, marginBottom: 10 }}>Enabling the chain, not part of the sale</div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10 }}>
            {ENABLERS.map((label) => (
              <span key={label} style={pill(label, true)}>{label}</span>
            ))}
          </div>
        </div>
      </Section>

      {/* WHO PAYS */}
      <Section id="who-pays" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={eyebrowStyle}>WHO PAYS FOR IT</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: 0 }}>
              Never the <em style={{ fontStyle: "italic", color: COLORS.text }}>farmer.</em>
            </h2>
          </div>
          <div className="coffee-cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            {PAYERS.map((c) => (
              <div key={c.tag} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "24px 26px" }}>
                <div style={{ ...eyebrowStyle, marginBottom: 10 }}>{c.tag}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, marginBottom: 8 }}>{c.title}</div>
                <div style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.7 }}>{c.body}</div>
              </div>
            ))}
          </div>

          {/* HONESTY NOTE */}
          <div
            style={{
              marginTop: 32,
              border: `1px dashed rgba(196,137,42,0.45)`,
              background: "rgba(196,137,42,0.06)",
              borderRadius: 6,
              padding: "18px 20px",
              maxWidth: 760,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            <div style={{ ...eyebrowStyle, color: COLORS.amber, marginBottom: 8 }}>What's proven, what isn't</div>
            <p style={{ fontSize: 13, color: COLORS.muted, lineHeight: 1.75, margin: 0 }}>
              This is an active pilot, not a finished product. The European Commission study and Coffee Act 2025 are
              verified public sources. Season-level pricing and cooperative-wide figures shown in the pilot are
              illustrative estimates, pending direct integration with Kenya's National Cherry Cooperative Union. We show
              our work — ask us what's proven and what's still a projection.
            </p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section id="cta" style={{ background: COLORS.bg, padding: "100px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <div style={eyebrowStyle}>↗ SEE IT FOR YOURSELF</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 44, lineHeight: 1.15, margin: "0 0 20px" }}>
            See the Nandi pilot<br /><em style={{ fontStyle: "italic", color: COLORS.text }}>for yourself.</em>
          </h2>
          <p style={{ fontSize: 14, color: COLORS.muted, maxWidth: 440, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Tell us who you are and we'll walk you through the pilot — the farmer's wallet, the cooperative roll-up, and
            the evidence behind every number.
          </p>
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "left" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 24 }}>Thanks, {submittedName}.</div>
                <div style={{ fontSize: 14, color: COLORS.muted, marginTop: 8 }}>We'll be in touch within one business day.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {([
                  { key: "name", label: "YOUR NAME", type: "text", required: true, placeholder: "" },
                  { key: "email", label: "EMAIL ADDRESS", type: "email", required: true, placeholder: "you@example.com" },
                  { key: "organisation", label: "ORGANISATION", type: "text", required: false, placeholder: "Company, cooperative, lender, or institution" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`coffee-${f.key}`} style={{ display: "block", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                      {f.label}{f.required && " *"}
                    </label>
                    <input
                      id={`coffee-${f.key}`}
                      ref={(el) => {
                        fieldRefs.current[f.key] = el;
                        if (f.key === "name") nameInputRef.current = el;
                      }}
                      type={f.type}
                      required={f.required}
                      value={form[f.key]}
                      onChange={(e) => {
                        setForm((s) => ({ ...s, [f.key]: e.target.value }));
                        if (fieldErr[f.key]) setFieldErr((p) => ({ ...p, [f.key]: undefined }));
                        if (err) setErr(null);
                      }}
                      onBlur={handleBlur(f.key)}
                      placeholder={f.placeholder}
                      maxLength={255}
                      style={{
                        width: "100%",
                        border: `1px solid ${fieldErr[f.key] ? "rgba(154,48,32,0.4)" : "rgba(26,22,14,0.15)"}`,
                        borderRadius: 4, background: "#fff", padding: "10px 14px",
                        fontFamily: FONT_BODY, fontSize: 14, color: COLORS.text, outline: "none",
                      }}
                    />
                    {fieldErr[f.key] && <div style={{ fontSize: 11, color: "#9A3020", marginTop: 4 }}>{fieldErr[f.key]}</div>}
                  </div>
                ))}
                <div>
                  <label htmlFor="coffee-use-case" style={{ display: "block", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    YOUR USE CASE *
                  </label>
                  <select
                    id="coffee-use-case"
                    ref={(el) => { fieldRefs.current["use_case"] = el; }}
                    required
                    value={form.use_case}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, use_case: e.target.value }));
                      if (fieldErr.use_case) setFieldErr((p) => ({ ...p, use_case: undefined }));
                    }}
                    onBlur={handleBlur("use_case")}
                    style={{
                      width: "100%",
                      border: `1px solid ${fieldErr.use_case ? "rgba(154,48,32,0.4)" : "rgba(26,22,14,0.15)"}`,
                      borderRadius: 4, background: "#fff", padding: "10px 14px",
                      fontFamily: FONT_BODY, fontSize: 14,
                      color: form.use_case ? COLORS.text : COLORS.faint, outline: "none",
                    }}
                  >
                    <option value="">Select one…</option>
                    {USE_CASES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {fieldErr.use_case && <div style={{ fontSize: 11, color: "#9A3020", marginTop: 4 }}>{fieldErr.use_case}</div>}
                </div>
                <div>
                  <label htmlFor="coffee-message" style={{ display: "block", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    ANYTHING ELSE?
                  </label>
                  <textarea
                    id="coffee-message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                    placeholder="Tell us about your situation — the more context, the better the walkthrough."
                    maxLength={2000}
                    style={{
                      width: "100%", border: "1px solid rgba(26,22,14,0.15)", borderRadius: 4,
                      background: "#fff", padding: "10px 14px", fontFamily: FONT_BODY,
                      fontSize: 14, color: COLORS.text, outline: "none", resize: "vertical",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: COLORS.dark, color: COLORS.darkText,
                    fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
                    border: "none", borderRadius: 4, padding: 12, width: "100%",
                    cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.85 : 1,
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Sending…" : "Request access to the pilot →"}
                </button>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint, textAlign: "center", marginTop: 8, letterSpacing: "0.04em" }}>
                  The Nandi sandbox is invite-only. We'll send access within one business day.
                </div>
                {err && <div role="alert" style={{ fontSize: 13, color: "#9A3020", textAlign: "center" }}>{err}</div>}
              </form>
            )}
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer
        style={{
          background: COLORS.dark, padding: "20px 24px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}
      >
        <Link to="/" style={{ fontFamily: FONT_MONO, fontSize: 13, color: "rgba(245,241,232,0.5)", textDecoration: "none" }}>← SCORE</Link>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "rgba(245,241,232,0.3)" }}>Contribution ledger · Early access</div>
      </footer>
    </div>
  );
}
