const FONT_DISPLAY = "'Playfair Display',Georgia,serif";
const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";
const ACCENT = "#5C7A3A";

export type NandiContributionRow = {
  id: string;
  label: string;
  occurred_on: string;
  amount_ksh: number;
  status: string;
};

const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString("en-KE")}`;

const isReceived = (s: string) => /received|paid|settled/i.test(s);
const isPending = (s: string) => /pending|await|due/i.test(s);

const STATUS_COLOR = (s: string) => (isReceived(s) ? "#2A6A45" : isPending(s) ? "#C4892A" : "#5C5248");

export const NandiFarmerWallet = ({
  contributions,
  name = "Aisha Ng'etich",
  initials = "AN",
  contributorId = "NANDI-AISHA-001",
}: {
  contributions: NandiContributionRow[];
  name?: string;
  initials?: string;
  contributorId?: string;
}) => {
  const sum = (pred: (s: string) => boolean) =>
    contributions.filter((c) => pred(c.status)).reduce((a, c) => a + Number(c.amount_ksh), 0);

  const received = sum(isReceived);
  const pending = sum(isPending);
  const projected = contributions.reduce((a, c) => a + Number(c.amount_ksh), 0);

  const recent = [...contributions]
    .sort((a, b) => (a.occurred_on < b.occurred_on ? 1 : -1))
    .slice(0, 3);

  return (
    <div
      style={{
        maxWidth: 420,
        width: "100%",
        margin: "0 auto",
        fontFamily: FONT_BODY,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          borderRadius: 20,
          background: `linear-gradient(160deg, ${ACCENT} 0%, #1A1614 120%)`,
          color: "#FDFAF4",
          padding: "22px 22px 26px",
          boxShadow: "0 10px 30px -16px rgba(26,22,14,0.4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "rgba(253,250,244,0.15)",
                border: "1px solid rgba(253,250,244,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_MONO, fontSize: 13, fontWeight: 600, flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{name}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 9, opacity: 0.7, marginTop: 1 }}>{contributorId}</div>
            </div>
          </div>
          <div
            style={{
              fontFamily: FONT_MONO, fontSize: 9, padding: "3px 8px", borderRadius: 3,
              background: "rgba(253,250,244,0.12)", letterSpacing: "0.06em", whiteSpace: "nowrap",
            }}
          >
            SCORE WALLET
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div
            style={{
              fontFamily: FONT_MONO, fontSize: 10, opacity: 0.72,
              textTransform: "uppercase", letterSpacing: "0.1em",
            }}
          >
            Money you have received
          </div>
          <div
            style={{
              fontFamily: FONT_DISPLAY, fontSize: 40, fontWeight: 600,
              marginTop: 6, lineHeight: 1.05, letterSpacing: "-0.01em",
            }}
          >
            {ksh(received)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, marginTop: 22 }}>
          {[
            { label: "Still waiting", value: pending },
            { label: "Total tracked", value: projected },
          ].map((f) => (
            <div key={f.label} style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT_MONO, fontSize: 9, opacity: 0.7,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}
              >
                {f.label}
              </div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, marginTop: 4, whiteSpace: "nowrap" }}>
                {ksh(f.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          borderRadius: 16, background: "#FDFAF4",
          border: "1px solid rgba(26,22,14,0.08)", padding: "16px 18px",
        }}
      >
        <div
          style={{
            fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}
        >
          Recent activity
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 13, color: "#5C5248" }}>Nothing recorded yet.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {recent.map((e) => {
              const color = STATUS_COLOR(e.status);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: `${color}1A`, color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: FONT_MONO, fontSize: 14, flexShrink: 0,
                    }}
                  >
                    {isReceived(e.status) ? "\u2193" : isPending(e.status) ? "\u2026" : "\u2022"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13, color: "#1A1614",
                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                      }}
                    >
                      {e.label}
                    </div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84", marginTop: 2 }}>
                      {e.occurred_on} · <span style={{ color }}>{e.status}</span>
                    </div>
                  </div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: "#1A1614", whiteSpace: "nowrap" }}>
                    {ksh(Number(e.amount_ksh))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: FONT_MONO, fontSize: 9, color: "#9A8F84",
          textAlign: "center", lineHeight: 1.6, padding: "0 12px",
        }}
      >
        Demonstration sandbox · Kaptumo Cooperative, Nandi County. This is a record of value, not a payment account.
      </div>
    </div>
  );
};
