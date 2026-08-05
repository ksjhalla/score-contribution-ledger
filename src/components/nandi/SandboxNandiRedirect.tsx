import { Navigate, useLocation } from "react-router-dom";

/** Continuity redirect: /sandbox/nandi/* -> /nandi/* */
export function SandboxNandiRedirect() {
  const location = useLocation();
  const target = location.pathname.replace(/^\/sandbox\/nandi/, "/nandi") + location.search;
  return <Navigate to={target || "/nandi"} replace />;
}

export default SandboxNandiRedirect;
