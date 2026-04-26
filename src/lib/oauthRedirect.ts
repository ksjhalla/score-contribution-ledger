export function buildOAuthRedirectUrl(_path?: string): string {
  return `${window.location.origin}/auth/callback`
}
