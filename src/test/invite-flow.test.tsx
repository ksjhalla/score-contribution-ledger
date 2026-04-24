import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

// Hoisted so the vi.mock factory (which is itself hoisted) can reference them.
const {
  channelSpy,
  onAuthStateChangeSpy,
  getSessionMock,
  rpcMock,
  fromMock,
} = vi.hoisted(() => ({
  channelSpy: vi.fn(),
  onAuthStateChangeSpy: vi.fn(() => ({
    data: { subscription: { unsubscribe: vi.fn() } },
  })),
  getSessionMock: vi.fn(),
  rpcMock: vi.fn(),
  fromMock: vi.fn(() => ({
    select: () => ({
      eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }),
    }),
  })),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    channel: channelSpy,
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeSpy,
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    rpc: rpcMock,
    from: fromMock,
  },
}));

import Invite from "@/pages/Invite";
import { PUBLIC_ROUTES } from "@/lib/routeGuard";

const renderInvite = () =>
  render(
    <MemoryRouter initialEntries={["/invite"]}>
      <Invite />
    </MemoryRouter>,
  );

describe("/invite page", () => {
  beforeEach(() => {
    channelSpy.mockReset();
    onAuthStateChangeSpy.mockClear();
    getSessionMock.mockReset();
    rpcMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
  });

  it("renders the form immediately with no loading spinner", async () => {
    renderInvite();
    expect(screen.getByPlaceholderText(/SCORE-XXXX-XXXX/i)).toBeInTheDocument();
    expect(screen.queryByText(/^loading/i)).not.toBeInTheDocument();
  });

  it("shows inline error for invalid invite code on submit", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null });
    renderInvite();

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/SCORE-XXXX-XXXX/i), "INVALID-CODE");
    await user.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await user.type(screen.getByLabelText(/^role$/i), "Engineer");
    // Click submit — sector still empty triggers field validation; type-trigger
    // the code error path by ensuring rpc returns false even after we fill all.
    await user.click(screen.getByRole("button", { name: /complete setup/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid, expired, or not for this email/i),
      ).toBeInTheDocument();
    });
  });

  it("does not set up any realtime subscriptions", async () => {
    renderInvite();
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    expect(channelSpy).not.toHaveBeenCalled();
    expect(onAuthStateChangeSpy).not.toHaveBeenCalled();
  });

  it("PUBLIC_ROUTES includes /invite", () => {
    expect(PUBLIC_ROUTES).toContain("/invite");
  });
});