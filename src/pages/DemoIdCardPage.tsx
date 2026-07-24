import { useDemo } from "@/contexts/DemoContext";
import { DemoIdCard } from "@/components/demo/DemoIdCard";

const FONT_BODY = "'DM Sans',system-ui,sans-serif";
const FONT_MONO = "'DM Mono',ui-monospace,monospace";

export default function DemoIdCardPage() {
  const { activeDemo } = useDemo();
  if (activeDemo === "none") {
    return (
      <div
        className="px-4 sm:px-6 py-16"
        style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", fontFamily: FONT_BODY }}
      >
        <div
          style={{
            fontFamily: FONT_MONO,
            fontSize: 10,
            color: "#9A8F84",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          ID Card
        </div>
        <p style={{ fontSize: 14, color: "#5C5248", lineHeight: 1.6 }}>
          Pick a demo profile from the sidebar to preview its Contributor ID card.
        </p>
      </div>
    );
  }
  return <DemoIdCard profileKey={activeDemo} />;
}