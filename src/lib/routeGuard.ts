// !! IMPORTANT !!
// Add any new public route here explicitly. Do not infer public status from
// route structure. /invite must remain public — it is accessed by users with
// no session after Google OAuth (or by signed-in users without a redeemed
// invite who land here via the soft gate).
export const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/auth",
  "/auth/callback",
  "/invite",
  "/attest", // prefix match (/attest/:token)
  "/passport", // prefix match (/passport/:contributorId)
  "/report",
] as const;

export const isPublicRoute = (pathname: string): boolean => {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    return pathname === route || pathname.startsWith(route + "/");
  });
};