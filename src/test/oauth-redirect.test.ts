import { describe, it, expect } from "vitest";
import { buildOAuthRedirectUrl } from "@/lib/oauthRedirect";

describe("buildOAuthRedirectUrl", () => {
  it("always returns /auth/callback on the current origin", () => {
    expect(buildOAuthRedirectUrl()).toBe(`${window.location.origin}/auth/callback`);
  });

  it("ignores any path argument", () => {
    expect(buildOAuthRedirectUrl("/dashboard")).toBe(`${window.location.origin}/auth/callback`);
    expect(buildOAuthRedirectUrl("/invite")).toBe(`${window.location.origin}/auth/callback`);
    expect(buildOAuthRedirectUrl(undefined)).toBe(`${window.location.origin}/auth/callback`);
  });
});
