import { useEffect, useRef, useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

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
            <Link to="/login" className="score-topbar-signin" style={{
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
            <Link to="/demo" style={{
              background: "transparent", color: COLORS.muted,
              fontFamily: FONT_BODY, fontSize: 14, padding: "12px 8px", textDecoration: "none",
            }} className="score-link-underline">See what it does</Link>
          </div>
          <div style={{
            display: "block", textAlign: "center", marginTop: 10,
            fontFamily: FONT_BODY, fontSize: 12, color: COLORS.faint,
          }}>
            Already have access? <Link to="/login" style={{ color: COLORS.faint, textDecoration: "underline" }}>Sign in →</Link>
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
          <div className="score-cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 32 }}>
            {[
              { eyebrow: "YOUR EARNINGS", title: "See what you're owed across every project", footer: "EARLY ACCESS ONLY", preview: "earnings" as const },
              { eyebrow: "THE PROOF", title: "Proof that you built it — permanent and portable", footer: "EARLY ACCESS ONLY", preview: "proof" as const },
              { eyebrow: "INVESTOR & AUDIT REPORTS", title: "One click to a report anyone can verify.", footer: "REQUEST A DEMO →", footerAmber: true, preview: "passport" as const },
            ].map((c, i) => (
              <div key={i} style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                background: COLORS.card, padding: 24,
                display: "flex", flexDirection: "column",
              }}>
                <div>
                  <div style={{ ...eyebrowStyle, marginBottom: 14 }}>{c.eyebrow}</div>
                  <h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, lineHeight: 1.3, margin: 0 }}>{c.title}</h3>
                </div>
                <div style={{
                  marginTop: 16, border: "1px solid rgba(26,22,14,0.08)", borderRadius: 4,
                  background: COLORS.bg, overflow: "hidden", position: "relative", height: 160,
                }}>
                  {c.preview === "earnings" && (
                    <div style={{ transform: "scale(0.72)", transformOrigin: "top left", width: "139%" }}>
                      <div style={{ display: "flex" }}>
                        {[
                          ["SETTLED", "$52,600", "#2A6A45"],
                          ["PENDING", "$14,000", COLORS.amber],
                          ["CONTRACTS", "3", COLORS.text],
                          ["EXECUTIONS", "7", COLORS.text],
                        ].map(([l, v, col], j) => (
                          <div key={j} style={{
                            flex: 1, padding: "10px 14px",
                            borderRight: j < 3 ? "1px solid rgba(26,22,14,0.08)" : "none",
                          }}>
                            <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: COLORS.faint }}>{l}</div>
                            <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: col, marginTop: 4 }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {[
                        ["SCORE Protocol Founding Agreement", "$52,600", "#2A6A45"],
                        ["Sahel Agri Cooperative MSA", "Attribution", "#2A5C8A"],
                      ].map(([n, val, col], j) => (
                        <div key={j} style={{
                          padding: "10px 14px", borderTop: "1px solid rgba(26,22,14,0.08)",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: COLORS.text }}>{n}</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: col }}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {c.preview === "proof" && (
                    <div style={{ transform: "scale(0.72)", transformOrigin: "top left", width: "139%" }}>
                      <div style={{ display: "flex", gap: 10, padding: "12px 14px" }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: "rgba(42,106,69,0.10)", border: "1px solid #2A6A45",
                          color: "#2A6A45", fontSize: 10, display: "flex",
                          alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>✓</div>
                        <div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 500, color: COLORS.text }}>API integration · license execution</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint, marginTop: 2 }}>License trigger · Nov 2024</div>
                          <div style={{
                            display: "inline-block", marginTop: 6,
                            background: COLORS.bg, border: "1px solid rgba(26,22,14,0.10)",
                            borderRadius: 3, padding: "3px 8px",
                            fontFamily: FONT_MONO, fontSize: 8, color: COLORS.faint,
                          }}>sha256: e3b0c44298fc1c14… · RFC 3161: 2024-11-14</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: "#2A6A45", marginTop: 4 }}>+$12,400</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {c.preview === "passport" && (
                    <div style={{ transform: "scale(0.72)", transformOrigin: "top left", width: "139%" }}>
                      <div style={{
                        background: COLORS.dark, padding: "14px 16px",
                        display: "flex", alignItems: "center", gap: 12,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: "50%",
                          background: "rgba(196,137,42,0.15)", border: "1px solid rgba(196,137,42,0.3)",
                          color: COLORS.amber, fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600,
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>KJ</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.darkText }}>Kaushal Jhaveri</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: "rgba(245,241,232,0.5)", marginTop: 2 }}>Protocol Architect · Independent</div>
                          <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "rgba(245,241,232,0.3)", marginTop: 3 }}>SCR-KJ-2024-001</div>
                        </div>
                        <div style={{
                          fontFamily: FONT_MONO, fontSize: 9, color: "#2A6A45",
                          background: "rgba(42,106,69,0.15)", borderRadius: 20, padding: "3px 9px",
                        }}>Trust 94/100</div>
                      </div>
                      <div style={{
                        display: "flex", background: COLORS.dark,
                        borderTop: "1px solid rgba(245,241,232,0.06)",
                      }}>
                        {[["$52.6K","Attributed"],["3","Contracts"],["7","Executions"]].map(([v,l], j) => (
                          <div key={j} style={{
                            flex: 1, padding: "10px 0", textAlign: "center",
                            borderRight: j < 2 ? "1px solid rgba(245,241,232,0.06)" : "none",
                          }}>
                            <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: COLORS.amber }}>{v}</div>
                            <div style={{ fontFamily: FONT_MONO, fontSize: 8, color: "rgba(245,241,232,0.35)", marginTop: 2 }}>{l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        background: COLORS.dark, padding: "10px 16px",
                        borderTop: "1px solid rgba(245,241,232,0.06)",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div style={{ fontFamily: FONT_BODY, fontSize: 10, color: "rgba(245,241,232,0.6)" }}>SCORE Protocol Founding Agreement</div>
                        <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.amber }}>Financial</div>
                      </div>
                      <div style={{
                        background: "rgba(245,241,232,0.04)",
                        borderTop: "1px solid rgba(245,241,232,0.06)",
                        padding: "8px 16px",
                        fontFamily: FONT_MONO, fontSize: 9, color: "rgba(245,241,232,0.3)",
                      }}>score.xyz/kj · verified contributor</div>
                    </div>
                  )}
                  <div style={{
                    position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                    background: "linear-gradient(transparent, #FDFAF4)", pointerEvents: "none",
                  }} />
                </div>
                <div style={{ marginTop: 16 }}>
                  {c.footerAmber ? (
                    <a href="#cta" onClick={scrollToCta} style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.amber, textDecoration: "none" }}>{c.footer}</a>
                  ) : (
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: COLORS.faint }}>{c.footer}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <a href="#cta" onClick={scrollToCta} style={{ fontFamily: FONT_BODY, fontSize: 13, color: COLORS.muted, textDecoration: "underline" }}>
              Book a demo to see the full platform →
            </a>
          </div>
        </div>
      </Section>

      {/* CONVERSATIONS */}
      <Section id="conversations" style={{ background: COLORS.bg, padding: "100px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={eyebrowStyle}>SCORE FAMILIAR</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 48, lineHeight: 1.15, margin: 0 }}>
              These are the <em style={{ fontStyle: "italic", color: COLORS.amber }}>conversations</em><br />
              we're trying to end.
            </h2>
          </div>
          <div className="score-cols-3" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            {[
              { icon: "💬", q: "We'll sort out the split later.", body: "Later arrives. The project is generating real money. Nobody remembers what was agreed. A conversation that should take five minutes turns into months of awkwardness.", chip: "With SCORE: the split is agreed and locked before work begins." },
              { icon: "📊", q: "Someone needs to calculate everyone's share.", body: "You spend a week pulling numbers from spreadsheets, email threads, and memory. The investor shouldn't need to trust your summary. They should be able to verify it themselves.", chip: "With SCORE: it calculates and distributes itself." },
              { icon: "🏢", q: "I left that company two years ago.", body: "The work you built is still running. Still generating value. But the payments go to the org, not to you. Because no one set it up the right way from the start.", chip: "With SCORE: your stake follows you, not your employer." },
              { icon: "❓", q: "Wait — who actually built that part?", body: "Three people claim it. No one has proof. A dispute that could have been avoided turns into something expensive and relationship-ending.", chip: "With SCORE: authorship is recorded, credited, and timestamped from day one." },
              { icon: "📋", q: "Can you put together a report for our investors?", body: "You spend a week pulling numbers from spreadsheets, email threads, and memory. The investor shouldn't need to trust your summary. They should be able to verify it themselves.", chip: "With SCORE: income and audit reports are generated in one click — with a full, verifiable trail behind them." },
              { icon: "🔍", q: "Due diligence is asking for the IP ownership docs.", body: "You have an NDA, a contract somewhere, and a vague memory of an email. Proving who owns what, when, and under what terms turns into weeks of archaeology before any deal can close.", chip: "With SCORE: every ownership record is timestamped, verified, and exportable. Diligence closes fast." },
            ].map((c, i) => (
              <div key={i} style={{
                border: `1px solid ${COLORS.border}`, borderRadius: 6,
                background: COLORS.card, padding: 20,
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ fontSize: 16, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 700, color: COLORS.text, marginBottom: 10 }}>"{c.q}"</div>
                <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.muted, lineHeight: 1.7, margin: "0 0 16px", flex: 1 }}>{c.body}</p>
                <div style={{
                  display: "block",
                  background: "rgba(196,137,42,0.10)",
                  border: "1px solid rgba(196,137,42,0.25)",
                  color: COLORS.amber,
                  fontFamily: FONT_MONO, fontSize: 9,
                  padding: "8px 10px", borderRadius: 4,
                  marginTop: 14,
                  lineHeight: 1.5,
                }}>{c.chip}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* VERTICALS */}
      <Section id="verticals" style={{ background: COLORS.surface, padding: "80px 0" }}>
        <div style={containerStyle}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={eyebrowStyle}>WHO IT'S FOR</div>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, lineHeight: 1.15, margin: "0 0 20px" }}>
              Eight industries.<br />One structural problem.
            </h2>
            <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: COLORS.muted, maxWidth: 540, margin: "0 auto", lineHeight: 1.7 }}>
              Wherever value creation is separable from employment, revenue has a tail, and no portable attribution infrastructure exists — SCORE fits.
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 40 }}>
            {["Software & Open Source","Pharma & Biotech","College Athletics","Music & Publishing","Film & Television","Agriculture","Manufacturing","AI Training Data"].map((s) => (
              <div key={s} style={{
                border: `1px solid ${COLORS.borderEm}`, background: COLORS.card,
                borderRadius: 4, padding: "8px 16px",
                fontFamily: FONT_BODY, fontSize: 13, fontWeight: 500, color: COLORS.text,
              }}>{s}</div>
            ))}
          </div>
          <div className="score-cols-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              [
                ["Software", "SCORE Protocol · 40% revenue share · Story Protocol on-chain"],
                ["Pharma", "Aspen Pharmacare · IFC-financed · Gqeberha · S.21 SA Patents Act"],
                ["NCAA", "Ohio State · House Settlement · $15.375M football pool · NIL Go FMV"],
                ["Music", "Co-writing split · DAW session timestamps · sync rights"],
              ],
              [
                ["Film", "WGA/SAG-AFTRA · streaming residuals · independent viewership record"],
                ["Agriculture", "Sahel Co-op · IoT yield sensor · sorghum protocol · UPOV PVR"],
                ["Mfg", "Meridian · line efficiency reader · ArbEG inventor compensation"],
                ["AI Data", "Training data provenance · EU AI Act Art. 53 · RFC 3161 timestamp"],
              ],
            ].map((col, ci) => (
              <div key={ci}>
                {col.map(([label, val], i) => (
                  <div key={i} style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${COLORS.borderSoft}`,
                  }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: COLORS.faint, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: COLORS.muted, lineHeight: 1.5 }}>{val}</div>
                  </div>
                ))}
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
              ["$313K", "attributed to date"],
              ["14", "active contracts"],
              ["4", "industries live"],
              ["100%", "portable on exit"],
            ].map(([num, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 40, color: COLORS.amber, lineHeight: 1 }}>{num}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: "rgba(245,241,232,0.45)", marginTop: 8, letterSpacing: "0.05em" }}>{label}</div>
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
