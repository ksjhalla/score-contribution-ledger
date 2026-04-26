import { afterEach, describe, expect, it, vi } from "vitest";
import { getAdminEmails, isAdminByEmail } from "@/lib/adminBypass";

describe("adminBypass (Lovable fallback)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("includes the hardcoded fallback when VITE_ADMIN_EMAILS is unset", () => {
    vi.stubEnv("VITE_ADMIN_EMAILS", "");
    expect(getAdminEmails()).toContain("ksjhalla@gmail.com");
  });

  it("isAdminByEmail matches the hardcoded fallback (case/whitespace-insensitive)", () => {
    vi.stubEnv("VITE_ADMIN_EMAILS", "");
    expect(isAdminByEmail("ksjhalla@gmail.com")).toBe(true);
    expect(isAdminByEmail("  KSJHALLA@gmail.com  ")).toBe(true);
    expect(isAdminByEmail("Ksjhalla@Gmail.Com")).toBe(true);
  });

  it("returns false for non-admin emails", () => {
    vi.stubEnv("VITE_ADMIN_EMAILS", "");
    expect(isAdminByEmail("someone@example.com")).toBe(false);
    expect(isAdminByEmail(null)).toBe(false);
    expect(isAdminByEmail(undefined)).toBe(false);
    expect(isAdminByEmail("")).toBe(false);
  });

  it("merges VITE_ADMIN_EMAILS entries with the hardcoded fallback", () => {
    vi.stubEnv("VITE_ADMIN_EMAILS", "  Other@Example.com , second@x.io ");
    const list = getAdminEmails();
    expect(list).toContain("ksjhalla@gmail.com");
    expect(list).toContain("other@example.com");
    expect(list).toContain("second@x.io");
    expect(isAdminByEmail("OTHER@example.com")).toBe(true);
  });

  it("dedupes when env duplicates the hardcoded fallback", () => {
    vi.stubEnv("VITE_ADMIN_EMAILS", "ksjhalla@gmail.com");
    const list = getAdminEmails();
    expect(list.filter((e) => e === "ksjhalla@gmail.com").length).toBe(1);
  });
});
