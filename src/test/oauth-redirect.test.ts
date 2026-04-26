import { describe, it, expect } from "vitest";
import { buildOAuthRedirectUrl } from "@/lib/oauthRedirect";

const ORIGIN = "https://app.example.com";

describe("buildOAuthRedirectUrl", () => {
  it("uses the requested path when it is safe", () => {
    expect(buildOAuthRedirectUrl("/dashboard", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("rewrites /invite to /dashboard", () => {
    expect(buildOAuthRedirectUrl("/invite", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("rewrites /auth to /dashboard", () => {
    expect(buildOAuthRedirectUrl("/auth", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("rewrites /complete-profile to /dashboard", () => {
    expect(buildOAuthRedirectUrl("/complete-profile", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("falls back to /dashboard when no path is provided", () => {
    expect(buildOAuthRedirectUrl(undefined, ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("rejects non-absolute paths", () => {
    expect(buildOAuthRedirectUrl("dashboard", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(buildOAuthRedirectUrl("https://evil.example.com/dashboard", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });

  it("strips query/hash for the forbidden-path comparison", () => {
    expect(buildOAuthRedirectUrl("/invite?ref=email", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
    expect(buildOAuthRedirectUrl("/invite#x", ORIGIN)).toBe(`${ORIGIN}/dashboard`);
  });
});