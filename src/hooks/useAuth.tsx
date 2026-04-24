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
    const path = window.location.pathname;
    if (isPublicRoute(path)) {
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s);
        setUser(s?.user ?? null);
        setLoading(false);
      });
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (event === "SIGNED_IN" && s) {
        const path = window.location.pathname;
        if (path === "/" || path.startsWith("/auth")) {
          navigate("/dashboard", { replace: true });
        }
      }
      if (event === "SIGNED_OUT") {
        navigate("/", { replace: true });
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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