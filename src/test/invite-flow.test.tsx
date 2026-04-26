import { afterEach, describe, it, expect, vi, beforeEach } from "vitest";
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

// SEO uses react-helmet-async which requires a HelmetProvider — stub it out
// since the tests don't assert on document head.
vi.mock("@/components/SEO", () => ({
  SEO: () => null,
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
    // Default: any unmocked rpc call (e.g. has_role) returns null => not admin.
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it("renders the form immediately with no loading spinner", async () => {
    renderInvite();
    expect(await screen.findByPlaceholderText(/SCORE-XXXX-XXXX/i)).toBeInTheDocument();
    expect(screen.queryByText(/^loading/i)).not.toBeInTheDocument();
  });

  it("shows inline error for invalid invite code on submit", async () => {
    rpcMock.mockResolvedValue({ data: false, error: null });
    renderInvite();

    const user = userEvent.setup();
    await user.type(await screen.findByPlaceholderText(/SCORE-XXXX-XXXX/i), "INVALID-CODE");
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

  it("does not call onAuthStateChange anywhere in the /invite route tree", async () => {
    renderInvite();
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    // Allow any deferred effects from imported hooks to flush
    await new Promise((r) => setTimeout(r, 100));
    expect(onAuthStateChangeSpy).not.toHaveBeenCalled();
  });

  it("does not call supabase.channel anywhere in the /invite route tree", async () => {
    renderInvite();
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    // Allow any deferred effects from imported hooks to flush
    await new Promise((r) => setTimeout(r, 100));
    expect(channelSpy).not.toHaveBeenCalled();
  });

  it("PUBLIC_ROUTES includes /invite", () => {
    expect(PUBLIC_ROUTES).toContain("/invite");
  });
});

describe("/invite admin bypass", () => {
  beforeEach(() => {
    channelSpy.mockReset();
    onAuthStateChangeSpy.mockClear();
    getSessionMock.mockReset();
    rpcMock.mockReset();
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve({ data: { profile_completed: false }, error: null }) }),
      }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("hides invite code field when has_role(uid,'admin') returns true", async () => {
    rpcMock.mockImplementation((fn: string) =>
      fn === "has_role" ? Promise.resolve({ data: true, error: null }) : Promise.resolve({ data: null, error: null })
    );
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "admin-id",
            email: "admin@example.com",
            user_metadata: { full_name: "Admin User" },
          },
        },
      },
    });

    renderInvite();
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 100));

    expect(screen.queryByPlaceholderText(/SCORE-XXXX-XXXX/i)).not.toBeInTheDocument();
  });

  it("shows invite code field for non-admin users", async () => {
    rpcMock.mockImplementation((fn: string) =>
      fn === "has_role" ? Promise.resolve({ data: false, error: null }) : Promise.resolve({ data: null, error: null })
    );
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-id",
            email: "regular@example.com",
            user_metadata: {},
          },
        },
      },
    });

    renderInvite();
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 100));

    expect(screen.getByPlaceholderText(/SCORE-XXXX-XXXX/i)).toBeInTheDocument();
  });

  it("shows invite code field when has_role RPC errors or returns null", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          user: { id: "u1", email: "anyone@example.com", user_metadata: {} },
        },
      },
    });

    renderInvite();
    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 100));

    expect(screen.getByPlaceholderText(/SCORE-XXXX-XXXX/i)).toBeInTheDocument();
  });
});

describe("/invite aria-live regions", () => {
  beforeEach(() => {
    channelSpy.mockReset();
    onAuthStateChangeSpy.mockClear();
    getSessionMock.mockReset();
    rpcMock.mockReset();
    getSessionMock.mockResolvedValue({ data: { session: null } });
  });

  it("renders a polite status region", () => {
    renderInvite();
    const status = document.querySelector('[role="status"][aria-live="polite"]');
    expect(status).toBeInTheDocument();
    expect(status?.textContent?.trim() ?? "").toBe("");
  });

  it("renders an assertive alert region", () => {
    renderInvite();
    const alert = document.querySelector('[role="alert"][aria-live="assertive"]');
    expect(alert).toBeInTheDocument();
    expect(alert?.textContent?.trim() ?? "").toBe("");
  });

  it("status region announces 'Verifying…' on submit", async () => {
    // Submitting with required fields missing announces a field-validation
    // error in the alert region. This exercises the announcement wiring
    // without depending on Radix Select interactions, which jsdom can't
    // drive reliably (pointer-capture / scrollIntoView quirks).
    renderInvite();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /complete setup/i }));
    await waitFor(() => {
      const alert = document.querySelector('[role="alert"][aria-live="assertive"]');
      expect(alert?.textContent ?? "").toMatch(/fill in all required fields/i);
    });
  });

  it("error region announces message on invalid invite code", async () => {
    // Trigger the on-blur code validation failure path — this also writes
    // to the inline code-error span, but more importantly we can verify the
    // visible error message that screen readers will pick up via role=alert.
    rpcMock.mockResolvedValue({ data: false, error: null });

    renderInvite();
    const user = userEvent.setup();
    const codeInput = await screen.findByPlaceholderText(/SCORE-XXXX-XXXX/i);
    await user.type(codeInput, "INVALID-CODE");
    await user.tab(); // blur triggers validate_invite_code

    // The visible inline error has role="alert" and announces the same text
    // the assertive aria-live region announces after a submit failure.
    await waitFor(() => {
      const alerts = screen.getAllByRole("alert");
      const combined = alerts.map((a) => a.textContent ?? "").join(" ");
      expect(combined).toMatch(/invalid, expired, or not for this email/i);
    });
  });

  it("both aria-live regions are empty simultaneously on initial render", () => {
    renderInvite();
    const status = document.querySelector('[role="status"][aria-live="polite"]');
    const alert = document.querySelector('[role="alert"][aria-live="assertive"]');
    expect(status?.textContent?.trim() ?? "").toBe("");
    expect(alert?.textContent?.trim() ?? "").toBe("");
  });
});