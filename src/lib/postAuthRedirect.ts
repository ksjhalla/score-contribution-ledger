const KEY = "post_auth_redirect";

export function isSafeNext(next: string | null | undefined): next is string {
  return !!next && next.startsWith("/") && !next.startsWith("//");
}

export function stashPostAuthRedirect(next: string) {
  if (isSafeNext(next)) {
    try {
      sessionStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }
}

/** Reads the URL `next` param, falling back to sessionStorage. Clears the stash. */
export function consumePostAuthRedirect(search?: string): string | null {
  const param = new URLSearchParams(search ?? window.location.search).get("next");
  let stashed: string | null = null;
  try {
    stashed = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  if (isSafeNext(param)) return param;
  if (isSafeNext(stashed)) return stashed;
  return null;
}