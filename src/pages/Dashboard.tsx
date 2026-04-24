import { Link } from "react-router-dom";
import { useDemo } from "@/contexts/DemoContext";
import { DemoPassportView } from "@/components/demo/DemoPassportView";

const Dashboard = () => {
  const { profile } = useDemo();
  if (profile) return <DemoPassportView profile={profile} />;
  return (
    <div style={{ padding: "32px 24px", maxWidth: 920, margin: "0 auto" }}>
      <h2 style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 28, fontWeight: 600, margin: "0 0 12px" }}>
        Your Passport
      </h2>
      <p style={{ fontFamily: "'DM Sans',system-ui,sans-serif", fontSize: 14, color: "#5C5248", lineHeight: 1.7, margin: "0 0 16px", maxWidth: 560 }}>
        Your dashboard view of contracts, executions, and attributed value will live here.
        For now, you can <Link to="/log-work" style={{ color: "#C4892A", textDecoration: "underline" }}>log work</Link> against your contracts.
      </p>
    </div>
  );
};

export default Dashboard;
