import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { isPublicRoute } from "@/lib/routeGuard";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // On public routes (/, /auth, /invite, /pricing, /attest/*, /passport/*, /report)
    // we do NOT subscribe to onAuthStateChange. This prevents WebSocket churn and
    // post-OAuth redirect loops on /invite. We still fetch the current session
    // once so consumers can read user state.
    const path = location.pathname;
    let cancelled = false;

    if (isPublicRoute(path)) {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        if (cancelled) return;
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      const currentPath = window.location.pathname;
      const setupRoutes = ["/invite", "/auth"];
      const isOnSetupRoute = setupRoutes.some((route) =>
        currentPath === route || currentPath.startsWith(route + "/"),
      );

      setSession(s);
      setUser(s?.user ?? null);

      if (event === "SIGNED_IN" && s) {
        if (isOnSetupRoute) return;

        const alreadyOnApp =
          currentPath.startsWith("/dashboard") ||
          currentPath.startsWith("/contracts") ||
          currentPath.startsWith("/log-work") ||
          currentPath.startsWith("/account");

        if (!alreadyOnApp) {
          navigate("/dashboard", { replace: true });
        }
        return;
      }

      if (event === "SIGNED_OUT") {
        const isProtectedRoute = !isPublicRoute(currentPath);
        if (isProtectedRoute) {
          navigate("/", { replace: true });
        }
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (cancelled) return;
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);