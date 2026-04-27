import { useEffect, useRef, useState, FormEvent, Fragment } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { toast } from "sonner";
import { conversationCards, type ConversationCard } from "@/data/marketingPreviews";
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
  borderEm: "rgba(26,22,14,0.13)",
  borderSoft: "rgba(26,22,14,0.08)",
};

const FONT_DISPLAY = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'DM Sans', system-ui, sans-serif";
const FONT_MONO = "'DM Mono', ui-monospace, monospace";

const emailSchema = z
  .string()
  .trim()
  .min(3, { message: "Email is too short." })
  .max(255, { message: "Email must be 255 characters or fewer." })
  .email({ message: "Please enter a valid email address." })
  .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, { message: "Please enter a valid email address." });

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
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, style: {
    opacity: shown ? 1 : 0,
    transform: shown ? "translateY(0)" : "translateY(16px)",
    transition: "opacity 0.5s ease, transform 0.5s ease",
  }};
}

function Section({ children, ...rest }: { children: React.ReactNode } & React.HTMLAttributes<HTMLElement>) {
  const { ref, style } = useReveal<HTMLElement>();
  return <section ref={ref} style={{ ...style, ...rest.style }} {...rest}>{children}</section>;
}

function ConversationsScroller({ cards }: { cards: ConversationCard[] }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const dragRef = useRef({ isDown: false, startX: 0, startScroll: 0 });

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const cardEls = Array.from(root.querySelectorAll<HTMLElement>("[data-conv-card]"));
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const idx = Number((e.target as HTMLElement).dataset.idx);
            if (!Number.isNaN(idx)) setActiveIdx(idx);
          }
        });
      },
      { root, threshold: [0.6] }
    );
    cardEls.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [cards.length]);

  const onMouseDown = (e: React.MouseEvent) => {
    const root = scrollRef.current;
    if (!root) return;
    dragRef.current = { isDown: true, startX: e.clientX, startScroll: root.scrollLeft };
    root.style.cursor = "grabbing";
  };
  const onMouseMove = (e: React.MouseEvent) => {
    const root = scrollRef.current;
    if (!root || !dragRef.current.isDown) return;
    root.scrollLeft = dragRef.current.startScroll - (e.clientX - dragRef.current.startX);
  };
  const stopDrag = () => {
    dragRef.current.isDown = false;
    if (scrollRef.current) scrollRef.current.style.cursor = "grab";
  };

  return (
    <div>
      <style>{`
        .conv-scroll::-webkit-scrollbar { display: none; }
        .conv-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      <div
        ref={scrollRef}
        className="conv-scroll"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        style={{
          display: "flex", gap: 16, overflowX: "auto",
          padding: "0 24px 8px", cursor: "grab",
          scrollSnapType: "x mandatory",
          userSelect: "none",
        }}
      >
        {cards.map((c, i) => (
          <div
            key={i}
            data-conv-card
            data-idx={i}
            style={{
              width: 300, flexShrink: 0,
              border: "1px solid rgba(26,22,14,0.10)",
              borderRadius: 6,
              background: "#FDFAF4",
              padding: 20,
              display: "flex", flexDirection: "column",
              scrollSnapAlign: "start",
            }}
          >
            <div style={{ fontSize: 16, marginBottom: 10 }}>{c.icon}</div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 700, color: "#1A1614", marginBottom: 10 }}>"{c.quote}"</div>
            <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: "#5C5248", lineHeight: 1.7, margin: "0 0 16px", flex: 1 }}>{c.body}</p>
            <div style={{
              background: "rgba(196,137,42,0.10)",
              border: "1px solid rgba(196,137,42,0.25)",
              color: "#C4892A",
              fontFamily: "'DM Mono', ui-monospace, monospace", fontSize: 9,
              padding: "8px 10px", borderRadius: 4,
              marginTop: 14, lineHeight: 1.5,
            }}>{c.resolution}</div>
          </div>
        ))}
        <div style={{ width: 8, flexShrink: 0 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
        {cards.map((_, i) => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: "50%",
            background: i === activeIdx ? "#1A1614" : "rgba(26,22,14,0.2)",
            transition: "background 0.2s ease",
          }} />
        ))}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  maxWidth: 920,
  margin: "0 auto",
  padding: "0 24px",
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: FONT_MONO,
  fontSize: 10,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: COLORS.faint,
  marginBottom: 12,
};

export default function Index() {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({});
  const [form, setForm] = useState({ name: "", email: "", organisation: "", use_case: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof typeof form, string>>>({});

  useEffect(() => {
    document.title = "SCORE — A new way for collaborative work to earn";
    const desc = document.querySelector('meta[name="description"]');
    const text = "SCORE is a new way for collaborative work to earn — fairly, automatically, and for as long as it's valuable.";
    if (desc) desc.setAttribute("content", text);
    else {
      const m = document.createElement("meta");
      m.name = "description"; m.content = text;
      document.head.appendChild(m);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("deleted") === "true") {
      toast.success("Your account has been deleted.", { duration: 5000 });
      params.delete("deleted");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
    }
  }, []);

  useEffect(() => {
    if (window.location.hash === "#cta") {
      setTimeout(() => document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const validateField = (key: keyof typeof form, value: string): string | undefined => {
    if (key === "name") {
      if (!value.trim()) return "Please enter your name.";
    }
    if (key === "email") {
      if (!value.trim()) return "Please enter your email.";
      const r = emailSchema.safeParse(value);
      if (!r.success) return "Please enter a valid email address.";
    }
    if (key === "use_case") {
      if (!value) return "Please select your use case.";
    }
    return undefined;
  };

  const handleBlur = (key: keyof typeof form) => () => {
    const msg = validateField(key, form[key]);
    setFieldErr((p) => ({ ...p, [key]: msg }));
  };

  const scrollToCta = (e?: React.MouseEvent) => {
    e?.preventDefault();
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => nameInputRef.current?.focus(), 600);
  };

  const smoothScroll = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
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
        setTimeout(() => (el as HTMLInputElement | HTMLSelectElement | null)?.focus(), 350);
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
      source: "marketing_cta",
    });
    setSubmitting(false);
    if (error) {
      setErr("Something went wrong. Email us at hello@score.xyz");
      trackEvent("demo_request_failed", { error: error.message });
      return;
    }
    trackEvent("demo_request_submitted", {
      use_case: parsed.data.use_case,
      has_message: (parsed.data.message?.length ?? 0) > 0,
    });
    setSubmittedName(parsed.data.name);
    setSubmitted(true);
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <SEO
        title="SCORE — Contribution Ledger"
        description="SCORE records what you built, proves it happened, and notifies when payment is due. A portable contribution ledger for collaborative work."
        url="https://score-contribution-ledger.lovable.app"
        ogDescription="What if your work kept paying you long after you built it? SCORE makes that possible."
        twitterDescription="What if your work kept paying you long after you built it?"
      />
      <style>{`
        @media (max-width: 640px) {
          .score-topbar-center { display: none !important; }
          .score-topbar-signin { display: none !important; }
          .score-hero-h { font-size: 48px !important; }
          .score-cols-3 { grid-template-columns: 1fr !important; }
          .score-cols-2 { grid-template-columns: 1fr !important; }
          .score-platform-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 767px) {
          .score-howitworks-row { flex-direction: column !important; }
          .score-howitworks-arrow { display: none !important; }
          .score-howitworks-step { padding: 20px 0 !important; }
        }
        .score-link-underline:hover { text-decoration: underline; }
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
          <a href="#hero" onClick={smoothScroll("hero")} style={{ fontFamily: FONT_MONO, fontSize: 13, color: COLORS.text, textDecoration: "none" }}>← SCORE</a>
          <div className="score-topbar-center" style={{
            border: "1px solid rgba(26,22,14,0.2)", borderRadius: 4,
            padding: "4px 10px", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted,
          }}>→ Now available</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link to="/pricing" className="score-topbar-signin" style={{
              fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, textDecoration: "none",
              padding: "9px 14px",
            }}>Pricing</Link>
            <Link to="/auth" onClick={() => trackEvent("signin_link_clicked", { source: "topbar" })} className="score-topbar-signin score-link-underline" style={{
              fontFamily: FONT_MONO, fontSize: 10, color: COLORS.text, textDecoration: "none",
              padding: "9px 14px",
            }}>Sign in</Link>
            <a href="#cta" onClick={scrollToCta} style={{
              background: COLORS.dark, color: COLORS.darkText,
              fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.06em",
              borderRadius: 4, padding: "9px 18px", textDecoration: "none",
            }}>REQUEST A DEMO</a>
          </div>
        </div>
      </header>

      {/* HERO */}
      <Section id="hero" style={{ padding: "80px 0 100px" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <div style={{
            display: "inline-block", border: "1px solid rgba(26,22,14,0.2)", borderRadius: 4,
            padding: "4px 10px", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.muted, marginBottom: 32,
          }}>↗ Now in use</div>
          <h1 className="score-hero-h" style={{
            fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 80, lineHeight: 1.1,
            letterSpacing: "-0.02em", margin: "0 auto 28px", maxWidth: 820,
          }}>
            What if your work<br />
            kept <em style={{ fontStyle: "italic", fontWeight: 700, color: COLORS.amber }}>paying you</em><br />
            long after <strong style={{ fontWeight: 700, color: COLORS.text }}>you built it?</strong>
          </h1>
          <p style={{
            fontFamily: FONT_BODY, fontSize: 16, color: COLORS.muted,
            maxWidth: 480, margin: "0 auto 36px", lineHeight: 1.7,
          }}>
            SCORE is your contribution passport. One place to see what you've built, what you've earned, what's still owed — and what could keep paying you for years.{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: COLORS.text, fontFamily: FONT_BODY }}>It follows you, not your employer.</em>
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#how-it-works-simple" onClick={smoothScroll("how-it-works-simple")} style={{
              background: COLORS.dark, color: COLORS.darkText,
              fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
              borderRadius: 4, padding: "12px 24px", textDecoration: "none",
            }}>See how it works →</a>
          </div>
          <div style={{
            display: "block", textAlign: "center", marginTop: 10,
            fontFamily: FONT_BODY, fontSize: 12, color: COLORS.faint,
          }}>
            Already have an account? <Link to="/auth" onClick={() => trackEvent("signin_link_clicked", { source: "hero" })} style={{ color: COLORS.amber, textDecoration: "none" }} className="score-link-underline">Sign in →</Link>
          </div>
        </div>
      </Section>

      {/* PROBLEM (dark) */}
      <Section id="problem" style={{ background: COLORS.dark, color: COLORS.darkText, padding: "80px 0" }}>
        <div style={containerStyle}>
          <div className="score-cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 48 }}>
            {[
              { eyebrow: "THE PATTERN", h1: "Most creators", h2: "get paid ", em: "once.", body: "A handshake, a fixed fee, a deliverable. The work goes on generating value — and the creator doesn't see a cent of it." },
              { eyebrow: "THE GAP", h1: "Cross-org work", h2: "has ", em: "no system.", body: "When people from different organisations build something together, there's no standard way to agree on stakes, track contributions, or make payments happen automatically." },
              { eyebrow: "IN PRACTICE", h1: "Fairness needs", h2: "", em: "infrastructure.", body: "Goodwill isn't enough. What's needed is a system that encodes the agreement, watches for the conditions, and distributes when the moment arrives." },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ ...eyebrowStyle, color: "rgba(245,241,232,0.5)", marginBottom: 16 }}>{c.eyebrow}</div>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1.15, margin: "0 0 20px", color: COLORS.darkText }}>
                  {c.h1}<br />{c.h2}<em style={{ fontStyle: "italic", color: COLORS.amber }}>{c.em}</em>
                </h2>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: "rgba(245,241,232,0.6)", lineHeight: 1.7, margin: 0 }}>{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* PLATFORM */}
      <Section id="platform" style={{ background: COLORS.bg, padding: "100px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={eyebrowStyle}>SCORE PLATFORM</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 48, margin: "0 0 20px", lineHeight: 1.15 }}>
              A platform built around<br />
              <em style={{ fontStyle: "italic", color: COLORS.text }}>a simple idea.</em>
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 15, color: COLORS.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              If you helped build something valuable, you should keep earning from it — proportionally, automatically, and without having to ask. SCORE makes that possible.
            </p>
          </div>
          <div className="score-platform-grid" style={{
            display: "grid", gridTemplateColumns: "60% 40%", gap: 16,
          }}>
            {/* LEFT — main earnings card */}
            <div style={{
              border: `1px solid ${COLORS.border}`, borderRadius: 6,
              background: COLORS.card, padding: 32,
              display: "flex", flexDirection: "column",
            }}>
              <div style={eyebrowStyle}>YOUR EARNINGS</div>
              <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 28, lineHeight: 1.25, margin: "0 0 16px" }}>
                See everything you're owed,<br />across every project.
              </h3>
              <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, lineHeight: 1.7, margin: "0 0 24px" }}>
                One view of what's been paid, what's pending, and what you're still owed — across every contract you've ever had, whether you're still there or not.
              </p>
              <div style={{
                marginTop: "auto",
                background: COLORS.surface, borderRadius: 4,
                padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 0,
              }}>
                {[
                  { value: "$52,600", label: "Settled", color: "#2A6A45" },
                  { value: "$14,000", label: "Pending", color: COLORS.amber },
                  { value: "3", label: "Contracts", color: "#2A5C8A" },
                ].map((s, j, arr) => (
                  <div key={j} style={{
                    flex: 1, padding: "0 12px",
                    borderRight: j < arr.length - 1 ? "1px solid rgba(26,22,14,0.10)" : "none",
                  }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: s.color }}>{s.value}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint, marginTop: 8 }}>
                Example · A. Contributor · SCR-AC-2025-001 · Protocol Architect
              </div>
            </div>
            {/* RIGHT — two stacked cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                background: COLORS.card, padding: "20px 24px", flex: 1,
              }}>
                <div style={eyebrowStyle}>THE PROOF</div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, lineHeight: 1.3, margin: "0 0 10px" }}>Permanent and portable.</h3>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, lineHeight: 1.7, margin: 0 }}>
                  Every contribution is SHA-256 fingerprinted and timestamped. The record follows your DID — not your employer.
                </p>
              </div>
              <div style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                background: COLORS.card, padding: "20px 24px", flex: 1,
                display: "flex", flexDirection: "column",
              }}>
                <div style={eyebrowStyle}>INVESTOR REPORTS</div>
                <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, lineHeight: 1.3, margin: "0 0 10px" }}>One click to a report anyone can verify.</h3>
                <p style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, lineHeight: 1.7, margin: "0 0 14px" }}>
                  Signed PDF. Full execution history. SHA-256 fingerprints. RFC 3161 timestamps. Structured as a professional credential.
                </p>
                <a href="#cta" onClick={scrollToCta} style={{
                  marginTop: "auto", alignSelf: "flex-start",
                  fontFamily: FONT_MONO, fontSize: 10, color: COLORS.amber,
                  textDecoration: "none",
                }} className="score-link-underline">Request a demo →</a>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS — plain-language */}
      <Section id="how-it-works-simple" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={{ ...containerStyle, maxWidth: 880 }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={eyebrowStyle}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: "0 0 14px" }}>
              Four steps. <em style={{ fontStyle: "italic", color: COLORS.text }}>That's it.</em>
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              From the work you do today to the value it returns tomorrow — and the years after.
            </p>
          </div>
          <div className="score-cols-2" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          }}>
            {[
              { n: "01", t: "Work gets recorded", b: "You log a contribution — a contract, a patent filing, a session, a commit. SCORE captures what you did and when." },
              { n: "02", t: "Value gets connected", b: "Each record is linked to the agreement that says what it's worth — royalties, milestones, splits, residuals." },
              { n: "03", t: "You see the full picture", b: "One view of what's been paid, what's pending, and what's still on its way. No spreadsheets. No guessing." },
              { n: "04", t: "You carry it forward", b: "The record follows you across jobs, deals, and platforms. Your contribution history is yours — permanent and portable." },
            ].map((s) => (
              <div key={s.n} style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                padding: "24px 26px",
              }}>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.amber, marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, color: COLORS.text, marginBottom: 8 }}>{s.t}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, lineHeight: 1.7 }}>{s.b}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* USE CASES — 4 ways value shows up */}
      <Section id="use-cases" style={{ background: COLORS.bg, padding: "80px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={eyebrowStyle}>WHERE IT FITS</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: "0 0 14px" }}>
              Four ways value<br /><em style={{ fontStyle: "italic", color: COLORS.text }}>shows up.</em>
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 520, margin: "0 auto", lineHeight: 1.7 }}>
              Different industries, same pattern. Work that keeps earning long after it's done.
            </p>
          </div>
          <div className="score-cols-2" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
          }}>
            {[
              {
                tag: "PHARMA / IP",
                title: "Work that pays over time",
                body: "A patent you co-invented today still earns when the drug ships. Royalties land where they should — for as long as they're due.",
                example: "$420K paid · $380K pending",
              },
              {
                tag: "ATHLETE / CONTRACT",
                title: "Work that follows your career",
                body: "Endorsements, NIL deals, performance bonuses. One record, across teams and seasons, that doesn't reset when you switch jerseys.",
                example: "$112K paid · $48K pending",
              },
              {
                tag: "SUPPLY CHAIN",
                title: "Work that scales across systems",
                body: "A cooperative, a grower, a supplier. Your contribution to the final product is logged once and tracked everywhere it goes.",
                example: "$86K paid · $24K pending",
              },
              {
                tag: "OPEN / AI",
                title: "Work that gets reused everywhere",
                body: "Code, datasets, training contributions. When something you built is used downstream, the credit and the payment find you.",
                example: "$31K paid · $19K pending",
              },
            ].map((c) => (
              <div key={c.tag} style={{
                background: COLORS.card,
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                padding: "24px 26px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ ...eyebrowStyle, marginBottom: 10 }}>{c.tag}</div>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, color: COLORS.text, marginBottom: 8, lineHeight: 1.3 }}>{c.title}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, lineHeight: 1.7, marginBottom: 14 }}>{c.body}</div>
                <div style={{
                  marginTop: "auto",
                  background: COLORS.surface, borderRadius: 4,
                  padding: "8px 12px",
                  fontFamily: FONT_MONO, fontSize: 11, color: COLORS.text,
                }}>{c.example}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* HOW IT WORKS — mechanism (technical) */}
      <Section id="how-it-works" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={{ ...containerStyle, maxWidth: 760 }}>
          <div style={{ textAlign: "center" }}>
            <div style={eyebrowStyle}>THE MECHANISM</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1.2, margin: "0 auto", maxWidth: 700 }}>
              The contract stays real.<br />The payment stays real.<br />SCORE is the ledger between them.
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 560, margin: "16px auto 48px", lineHeight: 1.75 }}>
              SCORE records what was contributed, proves it happened, and notifies when payment is due. Nothing about this requires a blockchain. Evidence is SHA-256 fingerprinted and RFC 3161 timestamped. The record is the value.
            </p>
          </div>
          <div className="score-howitworks-row" style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {[
              { n: "01", t: "Contract", b: "A real-world agreement defines what the contributor is owed and what condition must be met. SCORE records the reference — it does not hold the contract." },
              { n: "02", t: "Evidence", b: "Work is logged against the contract. Each record is SHA-256 fingerprinted and RFC 3161 timestamped at creation. Immutable from that point." },
              { n: "03", t: "Trigger & payment", b: "When the condition is met — a threshold crossed, a licence executed, a distribution event — SCORE notifies and records settlement. Payment moves through existing channels." },
            ].map((s, i, arr) => (
              <Fragment key={s.n}>
                <div className="score-howitworks-step" style={{
                  flex: 1, minWidth: 0, padding: "24px 28px", textAlign: "center",
                  wordBreak: "normal", overflowWrap: "break-word", hyphens: "none",
                }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.amber, marginBottom: 12 }}>{s.n}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>{s.t}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.muted, lineHeight: 1.7 }}>{s.b}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="score-howitworks-arrow" style={{
                    flexShrink: 0, alignSelf: "center", padding: "0 8px",
                    fontFamily: FONT_MONO, fontSize: 18, color: COLORS.amber,
                  }}>→</div>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </Section>

      {/* CONVERSATIONS */}
      <Section id="conversations" style={{ background: COLORS.bg, padding: "100px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center", marginBottom: 32 }}>
          <div style={eyebrowStyle}>SCORE FAMILIAR</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 44, lineHeight: 1.15, margin: "0 0 16px" }}>
            Sound familiar?
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 440, margin: "0 auto", lineHeight: 1.7 }}>
            Every one of these conversations has a structural fix.
          </p>
        </div>
        <ConversationsScroller cards={conversationCards} />
      </Section>

      {/* VERTICALS */}
      <Section id="verticals" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={eyebrowStyle}>WHO IT'S FOR</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: "0 0 12px" }}>
              Eight industries.<br />One structural problem.
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 520, margin: "12px auto 0", lineHeight: 1.7 }}>
              Wherever value creation is separable from employment, revenue has a tail, and no portable attribution infrastructure exists — SCORE fits.
            </p>
          </div>
          <div style={{
            display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10,
            maxWidth: 760, margin: "32px auto 0",
          }}>
            {[
              "Software & Open Source",
              "Pharma & Biotech",
              "College Athletics",
              "Music & Publishing",
              "Film & Television",
              "Agriculture",
              "Manufacturing",
              "AI Training Data",
            ].map((label) => (
              <span
                key={label}
                style={{
                  display: "inline-block",
                  background: COLORS.card,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 999,
                  padding: "8px 16px",
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  color: COLORS.text,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </Section>

      {/* PULL QUOTE (dark) */}
      <Section id="quote" style={{ background: COLORS.dark, color: COLORS.darkText, padding: "100px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <blockquote style={{
            fontFamily: FONT_DISPLAY, fontWeight: 600, fontStyle: "italic",
            fontSize: 32, lineHeight: 1.4, color: COLORS.darkText,
            maxWidth: 680, margin: "0 auto",
          }}>
            "If you helped make something valuable, you should keep earning from it.{" "}
            <em style={{ color: COLORS.amber, fontStyle: "italic" }}>That should be infrastructure, not a favour.</em>"
          </blockquote>
          <div style={{
            fontFamily: FONT_MONO, fontSize: 10, color: "rgba(245,241,232,0.4)",
            letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 24,
          }}>THE PRIMITIVE DIGITAL GOOD</div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 48, marginTop: 48 }}>
            {[
              ["Off-chain", "contracts stay in the real world"],
              ["SHA-256", "every evidence record fingerprinted"],
              ["RFC 3161", "timestamped at creation · immutable"],
              ["Portable", "record follows the contributor · not the org"],
            ].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONT_BODY, fontWeight: 700, fontSize: 32, color: COLORS.amber, lineHeight: 1, fontVariantLigatures: "none" }}>{num}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "rgba(245,241,232,0.4)", marginTop: 8, letterSpacing: "0.05em" }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section id="cta" style={{ background: COLORS.bg, padding: "100px 0" }}>
        <div style={{ ...containerStyle, textAlign: "center" }}>
          <div style={eyebrowStyle}>↗ SEE IT FOR YOURSELF</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 48, lineHeight: 1.15, margin: "0 0 20px" }}>
            Ready to see<br />
            <em style={{ fontStyle: "italic", color: COLORS.text }}>how it works?</em>
          </h2>
          <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 420, margin: "0 auto 32px", lineHeight: 1.7 }}>
            Book a short demo and we'll show you the platform end-to-end — earnings, ownership, automatic distributions, and the investor and audit reports that come out the other side.
          </p>
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "left" }}>
            {submitted ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 24, color: COLORS.text }}>
                  Thanks, {submittedName}.
                </div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, marginTop: 8 }}>
                  We'll be in touch within one business day.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {([
                  { key: "name", label: "YOUR NAME", type: "text", required: true, placeholder: "" },
                  { key: "email", label: "EMAIL ADDRESS", type: "email", required: true, placeholder: "you@example.com" },
                  { key: "organisation", label: "ORGANISATION", type: "text", required: false, placeholder: "Company, university, cooperative, or individual" },
                ] as const).map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`cta-${f.key}`} style={{ display: "block", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                      {f.label}{f.required && " *"}
                    </label>
                    <input
                      id={`cta-${f.key}`}
                      ref={(el) => {
                        fieldRefs.current[f.key] = el;
                        if (f.key === "name") nameInputRef.current = el;
                      }}
                      type={f.type}
                      required={f.required}
                      value={form[f.key]}
                      onChange={(e) => { setForm((s) => ({ ...s, [f.key]: e.target.value })); if (fieldErr[f.key]) setFieldErr((p) => ({ ...p, [f.key]: undefined })); if (err) setErr(null); }}
                      onBlur={handleBlur(f.key)}
                      placeholder={f.placeholder}
                      maxLength={255}
                      style={{
                        width: "100%", border: `1px solid ${fieldErr[f.key] ? "rgba(154,48,32,0.4)" : "rgba(26,22,14,0.15)"}`,
                        borderRadius: 4, background: "#fff",
                        padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.text, outline: "none",
                      }}
                    />
                    {fieldErr[f.key] && (
                      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020", marginTop: 4 }}>{fieldErr[f.key]}</div>
                    )}
                  </div>
                ))}
                <div>
                  <label htmlFor="cta-use-case" style={{ display: "block", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    YOUR USE CASE *
                  </label>
                  <select
                    id="cta-use-case"
                    ref={(el) => { fieldRefs.current["use_case"] = el; }}
                    required
                    value={form.use_case}
                    onChange={(e) => { setForm((s) => ({ ...s, use_case: e.target.value })); if (fieldErr.use_case) setFieldErr((p) => ({ ...p, use_case: undefined })); }}
                    onBlur={handleBlur("use_case")}
                    style={{
                      width: "100%", border: `1px solid ${fieldErr.use_case ? "rgba(154,48,32,0.4)" : "rgba(26,22,14,0.15)"}`,
                      borderRadius: 4, background: "#fff",
                      padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 14,
                      color: form.use_case ? COLORS.text : COLORS.faint, outline: "none",
                    }}
                  >
                    <option value="">Select one…</option>
                    {USE_CASES.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  {fieldErr.use_case && (
                    <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "#9A3020", marginTop: 4 }}>{fieldErr.use_case}</div>
                  )}
                </div>
                <div>
                  <label htmlFor="cta-message" style={{ display: "block", fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                    ANYTHING ELSE?
                  </label>
                  <textarea
                    id="cta-message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                    placeholder="Tell us about your situation — the more context, the better the demo."
                    maxLength={2000}
                    style={{
                      width: "100%", border: "1px solid rgba(26,22,14,0.15)",
                      borderRadius: 4, background: "#fff",
                      padding: "10px 14px", fontFamily: FONT_BODY, fontSize: 14, color: COLORS.text, outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
                <button type="submit" disabled={submitting} style={{
                  background: COLORS.dark, color: COLORS.darkText,
                  fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
                  border: "none", borderRadius: 4, padding: 12, width: "100%",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.85 : 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {submitting ? "Sending…" : "Request a demo →"}
                </button>
                <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint, textAlign: "center", marginTop: 8, letterSpacing: "0.04em" }}>
                  SCORE is currently invite-only. We'll send your invite code within one business day.
                </div>
                {err && (
                  <div role="alert" style={{ fontFamily: FONT_BODY, fontSize: 13, color: "#9A3020", textAlign: "center" }}>{err}</div>
                )}
              </form>
            )}
          </div>
        </div>
      </Section>

      {/* FOOTER */}
      <footer style={{
        background: COLORS.dark, padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
      }}>
        <a href="#hero" onClick={smoothScroll("hero")} style={{ fontFamily: FONT_MONO, fontSize: 13, color: "rgba(245,241,232,0.5)", textDecoration: "none" }}>← SCORE</a>
        <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "rgba(245,241,232,0.3)" }}>Contribution ledger · Early access</div>
      </footer>
    </div>
  );
}
