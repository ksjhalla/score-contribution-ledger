import { cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { channelSpy, getSessionMock, onAuthStateChangeSpy, removeChannelSpy } = vi.hoisted(() => ({
  channelSpy: vi.fn(),
  getSessionMock: vi.fn(),
  onAuthStateChangeSpy: vi.fn(),
  removeChannelSpy: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeSpy,
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: channelSpy,
    removeChannel: removeChannelSpy,
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import { AuthProvider } from "@/hooks/useAuth";
import { PUBLIC_ROUTES } from "@/lib/routeGuard";

const Stub = ({ label }: { label: string }) => <div data-testid="route">{label}</div>;

const mountAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<Stub label={path} />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("public routes never open realtime channels", () => {
  beforeEach(() => {
    channelSpy.mockReset();
    removeChannelSpy.mockReset();
    getSessionMock.mockReset();
    onAuthStateChangeSpy.mockReset();
    // Simulate an active signed-in session — this is the risky case where
    // a misplaced subscription would fire on public routes.
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-public-test", email: "u@example.com" } } },
    });
    onAuthStateChangeSpy.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
  });

  afterEach(() => {
    cleanup();
  });

  const publicPaths = [
    "/",
    "/pricing",
    "/auth",
    "/invite",
    "/attest/some-token",
    "/passport/SCR-AB-2026-001",
    "/report",
  ];

  it.each(publicPaths)("does not call supabase.channel on %s", async (path) => {
    const { unmount } = mountAt(path);
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(channelSpy).not.toHaveBeenCalled();
    unmount();
    expect(channelSpy).not.toHaveBeenCalled();
  });

  it("repeated mount/unmount cycles across public routes never open a channel", async () => {
    for (let i = 0; i < 5; i++) {
      for (const path of publicPaths) {
        const { unmount } = mountAt(path);
        await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
        unmount();
      }
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(channelSpy).not.toHaveBeenCalled();
    expect(removeChannelSpy).not.toHaveBeenCalled();
  });

  it("rapid mount/unmount of /invite specifically never opens a channel", async () => {
    for (let i = 0; i < 10; i++) {
      const { unmount } = mountAt("/invite");
      await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
      unmount();
    }
    await new Promise((r) => setTimeout(r, 50));
    expect(channelSpy).not.toHaveBeenCalled();
  });

  it("PUBLIC_ROUTES constant matches the paths exercised by this test", () => {
    // Guard against drift: if a new public route is added, surface it here.
    expect([...PUBLIC_ROUTES].sort()).toEqual(
      ["/", "/pricing", "/auth", "/auth/callback", "/invite", "/attest", "/passport", "/report"].sort(),
    );
  });
});