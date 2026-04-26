/**
 * Admin bypass email allowlist.
 *
 * Primary source of truth for admin status is the `user_roles` table
 * (server-side, RLS-backed via has_role RPC). This module provides a
 * client-side fallback for environments where roles haven't been provisioned
 * yet — notably fresh Lovable deploys where VITE_ADMIN_EMAILS may not be
 * surfaced to the bundle. All comparisons are lowercased + trimmed.
 */

const HARDCODED_ADMIN_EMAILS = ["ksjhalla@gmail.com"];

export const getAdminEmails = (): string[] => {
  const fromEnv = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ?? "";
  const envList = fromEnv
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const all = [
    ...HARDCODED_ADMIN_EMAILS.map((e) => e.toLowerCase().trim()),
    ...envList,
  ];
  return Array.from(new Set(all));
};

export const isAdminByEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;
  return getAdminEmails().includes(email.trim().toLowerCase());
};
