import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown } from "lucide-react";
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

const containerStyle: React.CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "0 24px",
};

type Tier = {
  label: string;
  price: string;
  subprice: string;
  features: string[];
  cta: { text: string; to?: string; href?: string; tier: "early_access" | "pro" | "enterprise"; destination: string };
  dark?: boolean;
};

const TIERS: Tier[] = [
  {
    label: "EARLY ACCESS",
    price: "Free",
    subprice: "While we're in beta",
    features: [
      "Up to 3 contracts",
      "Unlimited executions",
      "Evidence attachment",
      "SHA-256 fingerprinting",
      "Public passport URL",
      "Basic PDF export",
    ],
    cta: { text: "Get early access →", to: "/auth", tier: "early_access", destination: "/auth" },
  },
  {
    label: "PRO",
    price: "$29",
    subprice: "per month",
    dark: true,
    features: [
      "Unlimited contracts",
      "Unlimited executions",
      "Full evidence system",
      "Trigger monitoring + webhooks",
      "Attestation system",
      "Investor PDF reports",
      "Data export (JSON)",
      "Notification system",
      "Priority support",
    ],
    cta: { text: "Request access →", href: "/#cta", tier: "pro", destination: "/#cta" },
  },
  {
    label: "ENTERPRISE",
    price: "Custom",
    subprice: "Per organisation",
    features: [
      "Everything in Pro",
      "Multi-contributor admin view",
      "Custom contract templates",
      "API access",
      "Audit trail exports",
      "Dedicated onboarding",
      "SLA + legal review support",
    ],
    cta: { text: "Talk to us →", href: "#contact", tier: "enterprise", destination: "#contact" },
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "What counts as a contract?",
    a: "A contract is any agreement that defines what you're owed and what condition must be met. It can be a formal legal document, a revenue-sharing agreement, a co-writing split, or a reference to an on-chain IP asset. SCORE records the reference — it does not hold the contract.",
  },
  {
    q: "Is my data secure?",
    a: "Evidence is SHA-256 fingerprinted and RFC 3161 timestamped at creation. Fingerprints are immutable — once written, they cannot be changed. Your data is stored in a Supabase Postgres database with row-level security.",
  },
  {
    q: "Can I export my record?",
    a: "Yes. Your full record — contracts, executions, evidence fingerprints, and trigger history — is exportable as structured JSON at any time from your Account page. Your data is yours, independent of this platform.",
  },
];

function TierCard({ tier }: { tier: Tier }) {
  const headerBg = tier.dark ? COLORS.dark : COLORS.surface;
  const labelColor = tier.dark ? "rgba(245,241,232,0.5)" : COLORS.faint;
  const priceColor = tier.dark ? COLORS.darkText : COLORS.text;
  const subColor = tier.dark ? "rgba(245,241,232,0.5)" : COLORS.faint;
  const featureColor = tier.dark ? "rgba(245,241,232,0.85)" : COLORS.muted;
  const ctaStyle: React.CSSProperties = tier.dark
    ? { background: COLORS.amber, color: "#fff", border: "none" }
    : { background: COLORS.card, color: COLORS.text, border: "1px solid rgba(26,22,14,0.15)" };

  const onCtaClick = () => {
    trackEvent("pricing_cta_clicked", { tier: tier.cta.tier, destination: tier.cta.destination });
  };

  return (
    <div style={{
      flex: "1 1 240px", maxWidth: 300, minWidth: 240,
      border: `1px solid ${COLORS.border}`, borderRadius: 6,
      background: COLORS.card, overflow: "hidden",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ background: headerBg, padding: "24px 24px 20px" }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: labelColor, letterSpacing: "0.08em" }}>{tier.label}</div>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 36, color: priceColor, marginTop: 8, lineHeight: 1 }}>{tier.price}</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: subColor, marginTop: 6 }}>{tier.subprice}</div>
      </div>
      <div style={{ padding: "20px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", flex: 1 }}>
          {tier.features.map((f) => (
            <li key={f} style={{ fontFamily: FONT_BODY, fontSize: 13, color: featureColor, lineHeight: 1.8, display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Check size={14} color="#2A6A45" style={{ flexShrink: 0, marginTop: 6 }} aria-hidden /><span>{f}</span>
            </li>
          ))}
        </ul>
        {tier.cta.to ? (
          <Link to={tier.cta.to} onClick={onCtaClick} className="pricing-cta" style={{
            ...ctaStyle, textAlign: "center", textDecoration: "none",
            fontFamily: FONT_MONO, fontSize: 10, borderRadius: 4, padding: 10, display: "block",
          }}>{tier.cta.text}</Link>
        ) : (
          <a href={tier.cta.href} onClick={onCtaClick} className="pricing-cta" style={{
            ...ctaStyle, textAlign: "center", textDecoration: "none",
            fontFamily: FONT_MONO, fontSize: 10, borderRadius: 4, padding: 10, display: "block",
          }}>{tier.cta.text}</a>
        )}
      </div>
    </div>
  );
}

function FaqItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left",
          fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.text,
        }}
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          size={18}
          color={COLORS.faint}
          style={{
            flexShrink: 0,
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>
      {open && (
        <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, lineHeight: 1.7, margin: "0 0 18px", maxWidth: 680 }}>{a}</p>
      )}
    </div>
  );
}

export default function Pricing() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  useEffect(() => {
    trackEvent("pricing_page_viewed");
  }, []);

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <SEO
        title="Pricing — SCORE"
        description="Simple, transparent pricing for SCORE. Start free. Pay when you grow. Cancel any time."
        url="https://score-contribution-ledger.lovable.app/pricing"
        ogDescription="Start free with up to 3 contracts. Upgrade to Pro at $29/month for unlimited contracts, triggers, and investor reports."
      />
      <style>{`
        @media (max-width: 767px) {
          .pricing-tiers { flex-direction: column !important; align-items: stretch !important; }
          .pricing-tiers > * { max-width: none !important; }
          .pricing-h { font-size: 36px !important; }
        }
        .pricing-link:hover { text-decoration: underline; }
        .pricing-cta:hover { text-decoration: underline; }
      `}</style>

      {/* TOPBAR */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(245,241,232,0.92)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(26,22,14,0.08)",
        height: 52,
      }}>
        <div style={{ ...containerStyle, height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/" style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.text, textDecoration: "none" }}>← SCORE</Link>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Link to="/pricing" className="pricing-link" style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textDecoration: "none", padding: "9px 14px" }}>Pricing</Link>
            <Link
              to="/auth"
              onClick={() => trackEvent("signin_link_clicked", { source: "topbar" })}
              className="pricing-link"
              style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.text, textDecoration: "none", padding: "9px 14px" }}
            >Sign in</Link>
            <Link to="/#cta" style={{
              background: COLORS.dark, color: COLORS.darkText,
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.06em",
              borderRadius: 4, padding: "9px 18px", textDecoration: "none",
            }}>REQUEST A DEMO</Link>
          </div>
        </div>
      </header>

      <section style={{ padding: "80px 0 40px" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>PRICING</div>
          <h1 className="pricing-h" style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 48, lineHeight: 1.15, margin: "0 0 16px" }}>
            Simple, transparent pricing.
          </h1>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
            Start free. Pay when you grow. Cancel any time.
          </p>
        </div>
      </section>

      <section style={{ padding: "20px 0 80px" }}>
        <div style={{ ...containerStyle, maxWidth: 860 }}>
          <div className="pricing-tiers" style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
            {TIERS.map((t) => <TierCard key={t.label} tier={t} />)}
          </div>
        </div>
      </section>

      <section style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={{ ...containerStyle, maxWidth: 720 }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>FAQ</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 32, lineHeight: 1.2, margin: 0 }}>
              Common questions.
            </h2>
          </div>
          <div>
            {FAQ.map((item, i) => (
              <FaqItem
                key={item.q}
                q={item.q}
                a={item.a}
                open={openIdx === i}
                onToggle={() => {
                  const willOpen = openIdx !== i;
                  setOpenIdx(willOpen ? i : null);
                  if (willOpen) trackEvent("pricing_faq_opened", { question: item.q });
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="contact" style={{ padding: "60px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 28, margin: "0 0 12px" }}>Talk to us about Enterprise.</h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 460, margin: "0 auto 24px", lineHeight: 1.7 }}>
            Tell us about your organisation and we'll come back with a tailored proposal.
          </p>
          <Link to="/#cta" style={{
            background: COLORS.dark, color: COLORS.darkText,
            fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
            borderRadius: 4, padding: "12px 24px", textDecoration: "none", display: "inline-block",
          }}>Request a demo →</Link>
        </div>
      </section>

      <footer style={{
        background: COLORS.dark, padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <Link to="/" style={{ fontFamily: FONT_MONO, fontSize: 13, color: "rgba(245,241,232,0.5)", textDecoration: "none" }}>← SCORE</Link>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "rgba(245,241,232,0.3)" }}>Contribution ledger · Early access</div>
      </footer>
    </div>
  );
}