import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, channelSpy, useAuthMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  channelSpy: vi.fn(),
  useAuthMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: channelSpy,
    removeChannel: vi.fn(),
    from: fromMock,
    rpc: vi.fn(),
  },
}));

vi.mock("react-helmet-async", () => ({ Helmet: () => null }));
vi.mock("@/components/NotificationBell", () => ({ NotificationBell: () => null }));
vi.mock("@/components/demo/DemoProfileCards", () => ({ DemoProfileCards: () => null }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/contexts/DemoContext", () => ({
  useDemo: () => ({ activeDemo: "none", profile: null, setActiveDemo: vi.fn() }),
  DemoProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { AppShell } from "@/components/layout/AppShell";

const SIGNED_IN_USER = { id: "dash-user-001", email: "k@example.com" };

const resolvedFrom = (data: Record<string, unknown> | null) =>
  fromMock.mockImplementation(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
  }));

const renderShell = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<AppShell><div data-testid="content">content</div></AppShell>} />
        <Route path="/auth" element={<div>auth</div>} />
        <Route path="/invite" element={<div>invite</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("dashboard sidebar identity", () => {
  beforeEach(() => {
    fromMock.mockReset();
    channelSpy.mockReset();
    channelSpy.mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() });
    useAuthMock.mockReturnValue({
      user: SIGNED_IN_USER,
      session: { user: SIGNED_IN_USER },
      loading: false,
      signOut: vi.fn(),
    });
  });

  afterEach(cleanup);

  it("renders contributor ID in sidebar once profile resolves", async () => {
    resolvedFrom({ full_name: "Kaushal Jhalla", contributor_id: "SCR-KJ-2026-001" });
    renderShell();
    await waitFor(() =>
      expect(screen.getByText("SCR-KJ-2026-001")).toBeInTheDocument(),
    );
  });

  it("calls supabase.from('profiles') to load identity when user is available", async () => {
    const profileCallCount = { n: 0 };
    fromMock.mockImplementation((table: string) => {
      if (table === "profiles") profileCallCount.n += 1;
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
    });
    renderShell();
    await waitFor(() => expect(profileCallCount.n).toBeGreaterThan(0));
  });
});
