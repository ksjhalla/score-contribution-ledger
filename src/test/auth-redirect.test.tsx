import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { channelSpy, getSessionMock, onAuthStateChangeSpy } = vi.hoisted(() => ({
  channelSpy: vi.fn(),
  getSessionMock: vi.fn(),
  onAuthStateChangeSpy: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeSpy,
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    channel: channelSpy,
    removeChannel: vi.fn(),
  },
}));

import { AuthProvider } from "@/hooks/useAuth";

type AuthEventCallback = (event: "SIGNED_IN" | "SIGNED_OUT", session: unknown) => void;

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

const renderAuthAt = (path: string) => {
  window.history.pushState({}, "", path);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
};

describe("auth redirects and realtime setup", () => {
  let authChangeCallback: AuthEventCallback | undefined;

  beforeEach(() => {
    authChangeCallback = undefined;
    channelSpy.mockReset();
    getSessionMock.mockReset();
    onAuthStateChangeSpy.mockReset();
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-123", email: "test@example.com" } } },
    });
    onAuthStateChangeSpy.mockImplementation((callback: AuthEventCallback) => {
      authChangeCallback = callback;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });
  });

  it("does not subscribe to auth changes or realtime on /invite", async () => {
    renderAuthAt("/invite");

    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    expect(onAuthStateChangeSpy).not.toHaveBeenCalled();
    expect(channelSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/invite");
  });

  it("does not subscribe to auth changes or realtime on /auth", async () => {
    renderAuthAt("/auth");

    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    expect(onAuthStateChangeSpy).not.toHaveBeenCalled();
    expect(channelSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/auth");
  });

  it("navigates to /dashboard on SIGNED_IN from a protected non-app route", async () => {
    renderAuthAt("/admin");

    await waitFor(() => expect(authChangeCallback).toBeDefined());
    authChangeCallback?.("SIGNED_IN", { user: { id: "user-123" } });

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/dashboard"));
  });

  it("does not redirect redundantly on SIGNED_IN when already on /dashboard", async () => {
    renderAuthAt("/dashboard");

    await waitFor(() => expect(authChangeCallback).toBeDefined());
    authChangeCallback?.("SIGNED_IN", { user: { id: "user-123" } });

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard");
  });

  it("navigates to / on SIGNED_OUT from a protected route", async () => {
    renderAuthAt("/dashboard");

    await waitFor(() => expect(authChangeCallback).toBeDefined());
    authChangeCallback?.("SIGNED_OUT", null);

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/"));
  });

  it("does not navigate on SIGNED_OUT from a public route", async () => {
    renderAuthAt("/");

    await waitFor(() => expect(getSessionMock).toHaveBeenCalled());
    expect(onAuthStateChangeSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId("location")).toHaveTextContent("/");
  });
});