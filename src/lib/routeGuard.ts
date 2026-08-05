// !! IMPORTANT !!
// Add any new public route here explicitly. Do not infer public status from
// route structure. /invite must remain public — it is accessed by users with
// no session after Google OAuth (or by signed-in users without a redeemed
// invite who land here via the soft gate).
export const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/coffee",
  "/auth",
  "/auth/callback",
  "/invite",
  "/attest", // prefix match (/attest/:token)
  "/passport", // prefix match (/passport/:contributorId)
  "/report",
  "/sandbox", // prefix match (/sandbox/nandi/:audience) — code-gated, no account
  "/nandi", // prefix match (/nandi/:audience) — gated by NandiInviteGate, not the global auth guard
] as const;

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });
};