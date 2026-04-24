import { useEffect, useRef, useState, FormEvent, Fragment } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { conversationCards, type ConversationCard } from "@/data/marketingPreviews";

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
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  const scrollToCta = (e?: React.MouseEvent) => {
    e?.preventDefault();
    document.getElementById("cta")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => emailInputRef.current?.focus(), 600);
  };

  const smoothScroll = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErr(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setErr(parsed.error.issues[0]?.message ?? "Please enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("demo_requests").insert({
      email: parsed.data,
      source: "homepage_cta",
    });
    setSubmitting(false);
    if (error) {
      // Server-side validation (RLS check constraint) rejected the input.
      const msg = /check constraint|violates/i.test(error.message)
        ? "That email doesn't look valid. Please double-check and try again."
        : "Something went wrong. Please try again.";
      setErr(msg);
      return;
    }
    setSubmitted(true);
  };

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: FONT_BODY, minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 640px) {
          .score-topbar-center { display: none !important; }
          .score-topbar-signin { display: none !important; }
          .score-hero-h { font-size: 48px !important; }
          .score-cols-3 { grid-template-columns: 1fr !important; }
          .score-cols-2 { grid-template-columns: 1fr !important; }
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
            <Link to="/auth" className="score-topbar-signin" style={{
              fontFamily: FONT_MONO, fontSize: 11, color: COLORS.muted, textDecoration: "none",
            }}>Sign in →</Link>
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
            Most people who build things together get paid once, imprecisely, and then it's over.{" "}
            <em style={{ fontStyle: "italic", fontWeight: 400, color: COLORS.text, fontFamily: FONT_BODY }}>We think that's wrong.</em>{" "}
            SCORE is a new way for collaborative work to earn — fairly, automatically, and for as long as it's valuable.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#cta" onClick={scrollToCta} style={{
              background: COLORS.dark, color: COLORS.darkText,
              fontFamily: FONT_BODY, fontSize: 14, fontWeight: 500,
              borderRadius: 4, padding: "12px 24px", textDecoration: "none",
            }}>Request a demo →</a>
          </div>
          <div style={{
            display: "block", textAlign: "center", marginTop: 10,
            fontFamily: FONT_BODY, fontSize: 12, color: COLORS.faint,
          }}>
            Already have access? <Link to="/auth" style={{ color: COLORS.faint, textDecoration: "underline" }}>Sign in →</Link>
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
                Live example · Kaushal Jhaveri · SCR-KJ-2024-001
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

      {/* HOW IT WORKS */}
      <Section id="how-it-works" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={{ ...containerStyle, maxWidth: 760 }}>
          <div style={{ textAlign: "center" }}>
            <div style={eyebrowStyle}>HOW IT WORKS</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 36, lineHeight: 1.2, margin: "0 auto", maxWidth: 700 }}>
              The contract stays real.<br />The payment stays real.<br />SCORE is the ledger between them.
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 560, margin: "16px auto 48px", lineHeight: 1.75 }}>
              SCORE records what was contributed, proves it happened, and notifies when payment is due. Nothing about this requires a blockchain. Evidence is SHA-256 fingerprinted and RFC 3161 timestamped. The record is the value.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {[
              { n: "01", t: "Contract", b: "A real-world agreement defines what the contributor is owed and what condition must be met. SCORE records the reference — it does not hold the contract." },
              { n: "02", t: "Evidence", b: "Work is logged against the contract. Each record is SHA-256 fingerprinted and RFC 3161 timestamped at creation. Immutable from that point." },
              { n: "03", t: "Trigger & payment", b: "When the condition is met — a threshold crossed, a licence executed, a distribution event — SCORE notifies and records settlement. Payment moves through existing channels." },
            ].map((s, i, arr) => (
              <Fragment key={s.n}>
                <div style={{
                  flex: 1, minWidth: 0, padding: "24px 28px", textAlign: "center",
                  wordWrap: "break-word", hyphens: "none",
                }}>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: COLORS.amber, marginBottom: 12 }}>{s.n}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>{s.t}</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.muted, lineHeight: 1.7 }}>{s.b}</div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{
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
              Four industries.<br />One structural problem.
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 520, margin: "12px auto 0", lineHeight: 1.7 }}>
              Wherever a contribution creates long-tail value and no portable record exists — SCORE fits.
            </p>
          </div>
          <div className="score-cols-2" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
            maxWidth: 760, margin: "32px auto 0",
          }}>
            {[
              { icon: "⌨", title: "Knowledge work & software", body: "Open source contributors, protocol architects, and AI training data labellers whose code or data generates downstream value long after the work is done.", chip: "e.g. SCORE Protocol · Story Protocol on-chain" },
              { icon: "🧪", title: "Institutional research", body: "Pharma researchers, biotech scientists, and university inventors whose discoveries generate royalties under Bayh-Dole, S.21, or equivalent inventor compensation law.", chip: "e.g. Aspen Pharmacare · IFC-financed · WHO-GMP · Gqeberha" },
              { icon: "🎬", title: "Creative & performance", body: "Musicians, writers, filmmakers, and athletes whose work generates residuals, splits, NIL licensing revenue, or union distribution rights over years or decades.", chip: "e.g. Ohio State · House Settlement · NIL Go FMV · $15.375M pool" },
              { icon: "⚙", title: "Industrial & cooperative", body: "Process engineers, floor supervisors, and cooperative farmers whose innovations get adopted globally but whose contribution record stays with the institution.", chip: "e.g. Meridian Manufacturing · ArbEG · line efficiency reader · IoT trigger" },
            ].map((b) => (
              <div key={b.title} style={{
                background: COLORS.card, border: `1px solid ${COLORS.border}`,
                borderRadius: 6, padding: "20px 22px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ fontSize: 16, marginBottom: 10 }}>{b.icon}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 15, fontWeight: 600, color: COLORS.text }}>{b.title}</div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.muted, lineHeight: 1.7, margin: "6px 0 0", flex: 1 }}>{b.body}</p>
                <div style={{
                  marginTop: 14, alignSelf: "flex-start",
                  fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint,
                  background: "rgba(26,22,14,0.04)", border: "1px solid rgba(26,22,14,0.08)",
                  borderRadius: 3, padding: "4px 8px",
                }}>{b.chip}</div>
              </div>
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
          <div style={{ maxWidth: 420, margin: "0 auto" }}>
            {submitted ? (
              <div style={{
                fontFamily: FONT_BODY, fontSize: 14, color: COLORS.text,
                padding: "14px 16px", border: `1px solid ${COLORS.border}`,
                borderRadius: 4, background: COLORS.card,
              }}>Thanks — we'll be in touch.</div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: "flex", width: "100%" }}>
                <input
                  ref={emailInputRef}
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (err) setErr(null); }}
                  placeholder="your@email.com"
                  maxLength={255}
                  aria-invalid={!!err}
                  aria-describedby={err ? "cta-email-error" : undefined}
                  style={{
                    flex: 1, border: "1px solid rgba(26,22,14,0.15)",
                    borderRadius: "4px 0 0 4px", background: "#fff",
                    padding: "12px 16px", fontFamily: FONT_BODY, fontSize: 14,
                    color: COLORS.text, outline: "none",
                    borderColor: err ? "#9A3020" : "rgba(26,22,14,0.15)",
                  }}
                />
                <button type="submit" disabled={submitting} style={{
                  background: COLORS.dark, color: COLORS.darkText,
                  fontFamily: FONT_MONO, fontSize: 11, letterSpacing: "0.06em",
                  border: "none", borderRadius: "0 4px 4px 0",
                  padding: "12px 18px", cursor: submitting ? "wait" : "pointer",
                }}>{submitting ? "SENDING…" : "REQUEST A DEMO"}</button>
              </form>
            )}
            {err && (
              <div
                id="cta-email-error"
                role="alert"
                style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#9A3020", marginTop: 8, textAlign: "left" }}
              >
                {err}
              </div>
            )}
            {!submitted && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.faint, marginTop: 12 }}>
                We'll be in touch within one business day.
              </div>
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
