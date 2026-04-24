import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F1E8",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 24,
          fontWeight: 600,
          color: "#1A1614",
          margin: "0 0 16px",
        }}
      >
        Page not found.
      </h1>
      <a
        href="/"
        style={{
          fontFamily: "'DM Mono', ui-monospace, monospace",
          fontSize: 10,
          color: "#C4892A",
          textDecoration: "none",
        }}
      >
        Return to home →
      </a>
    </div>
  );
};

export default NotFound;
