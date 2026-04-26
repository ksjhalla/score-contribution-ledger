/**
 * OAuth redirect URL safety.
 *
 * OAuth callbacks must NEVER land on a setup-only route like /invite or /auth
 * itself — those routes don't expect a URL fragment containing an access_token
 * and historically caused redirect loops + Chromium navigation throttling
 * (Supabase's detectSessionInUrl re-parses the hash on every mount, calling
 * history.replaceState in a tight loop).
 *
 * The contract is: OAuth always lands on /dashboard. Dashboard's own
 * profile-completion check is the single source of truth for routing
 * incomplete users to /invite — done AFTER the session is fully established
 * and the URL hash is gone, so the loop can't form.
 */

const FORBIDDEN_CALLBACK_PATHS = new Set<string>([
  "/invite",
  "/auth",
  "/complete-profile",
]);

const SAFE_FALLBACK = "/dashboard";

/**
 * Given a desired post-auth path, return a safe absolute URL on the current
 * origin. Forbidden paths (setup routes) are rewritten to /dashboard.
 * Off-origin URLs are also rewritten — we never trust an external redirect.
 */
export const buildOAuthRedirectUrl = (
  desiredPath: string | undefined,
  origin: string = typeof window !== "undefined" ? window.location.origin : "",
): string => {
  let path = SAFE_FALLBACK;

  if (desiredPath && desiredPath.startsWith("/")) {
    // Strip query/hash for the comparison; we re-attach below.
    const [pathOnly] = desiredPath.split(/[?#]/);
    if (!FORBIDDEN_CALLBACK_PATHS.has(pathOnly)) {
      path = desiredPath;
    }
  }

  return `${origin}${path}`;
};