import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { channelSpy, getSessionMock, rpcMock, fromMock } = vi.hoisted(() => ({
  channelSpy: vi.fn(),
  getSessionMock: vi.fn(),
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: channelSpy,
    removeChannel: vi.fn(),
    rpc: rpcMock,
    from: fromMock,
  },
}));

vi.mock("@/components/SEO", () => ({ SEO: () => null }));

vi.mock("react-helmet-async", () => ({ Helmet: () => null }));

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: { value?: string; onValueChange: (value: string) => void; children: ReactNode }) => {
    const options = Array.isArray(children) ? children.flatMap((child) => child) : [children];
    return (
      <select id="sector" aria-label="Sector" value={value ?? ""} onChange={(event) => onValueChange(event.target.value)}>
        <option value="">Select a sector</option>
        {options}
      </select>
    );
  },
  SelectContent: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  SelectValue: () => null,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "user-google-123", email: "kaushal@example.com" },
    session: { user: { id: "user-google-123", email: "kaushal@example.com" } },
    loading: false,
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
}));

import Invite from "@/pages/Invite";
import { AppShell } from "@/components/layout/AppShell";

const userSession = {
  user: {
    id: "user-google-123",
    email: "kaushal@example.com",
    user_metadata: { full_name: "Kaushal Jhalla" },
  },
};

const setupSupabaseMocks = () => {
  getSessionMock.mockResolvedValue({ data: { session: userSession } });
  rpcMock.mockImplementation((fn: string) => {
    if (fn === "current_user_has_redeemed_invite") return Promise.resolve({ data: true, error: null });
    if (fn === "validate_invite_code") return Promise.resolve({ data: true, error: null });
    if (fn === "complete_profile_with_contributor_id") {
      return Promise.resolve({ data: { contributor_id: "SCR-KJ-2026-001" }, error: null });
    }
    if (fn === "redeem_invite_code") return Promise.resolve({ data: true, error: null });
    return Promise.resolve({ data: null, error: null });
  });
  fromMock.mockImplementation((table: string) => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({
      data: table === "profiles"
        ? {
            profile_completed: false,
            full_name: "Kaushal Jhalla",
            contributor_id: "SCR-KJ-2026-001",
          }
        : null,
      error: null,
    }),
    then: (resolve: (value: { data: unknown[]; error: null }) => void) => resolve({ data: [], error: null }),
  }));
};

const DashboardShell = () => (
  <AppShell>
    <div>Dashboard ready</div>
  </AppShell>
);

describe("invite flow hardening", () => {
  beforeEach(() => {
    channelSpy.mockReset();
    getSessionMock.mockReset();
    rpcMock.mockReset();
    fromMock.mockReset();
    setupSupabaseMocks();
  });

  it("completes invite setup and shows contributor ID on dashboard", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/invite"]}>
        <Routes>
          <Route path="/invite" element={<Invite />} />
          <Route path="/dashboard" element={<DashboardShell />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/you need an invite/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/full name/i)).toHaveValue("Kaushal Jhalla"));
    expect(screen.getByText(/SCR-KJ-2026-001/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/SCORE-XXXX-XXXX/i), "SCORE-EARLY-2026");
    await user.type(screen.getByLabelText(/^role$/i), "Protocol Architect");
    await user.selectOptions(screen.getByLabelText(/sector/i), "Software");
    await user.click(screen.getByRole("button", { name: /complete setup/i }));

    await waitFor(() => {
      expect(rpcMock).toHaveBeenCalledWith(
        "validate_invite_code",
        expect.objectContaining({ p_code: "SCORE-EARLY-2026" }),
      );
    });
    await waitFor(() => expect(screen.getByText("SCR-KJ-2026-001")).toBeInTheDocument());
  });

  it("creates zero realtime channels while /invite has an active Google session", async () => {
    render(
      <MemoryRouter initialEntries={["/invite"]}>
        <Routes>
          <Route path="/invite" element={<Invite />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/you need an invite/i)).toBeInTheDocument());
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(channelSpy).not.toHaveBeenCalled();
  });
});