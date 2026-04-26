import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: string; email: string }

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function check() {
      // After OAuth redirect, tokens may arrive in two ways:
      // 1. Lovable broker: query string ?access_token=...&refresh_token=...
      // 2. Supabase implicit: hash #access_token=...&refresh_token=...
      // In both cases we set the Supabase session explicitly, then clean the URL.
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href)
        const qsAccess = url.searchParams.get("access_token")
        const qsRefresh = url.searchParams.get("refresh_token")

        let hashAccess: string | null = null
        let hashRefresh: string | null = null
        if (window.location.hash.includes("access_token")) {
          const hp = new URLSearchParams(window.location.hash.replace(/^#/, ""))
          hashAccess = hp.get("access_token")
          hashRefresh = hp.get("refresh_token")
        }

        const access_token = qsAccess ?? hashAccess
        const refresh_token = qsRefresh ?? hashRefresh

        if (access_token && refresh_token) {
          await supabase.auth.setSession({ access_token, refresh_token })
          window.history.replaceState(null, "", window.location.pathname)
        } else if (window.location.hash.includes("access_token")) {
          // Fall back to Supabase's own URL parsing.
          await supabase.auth.getSession()
          window.history.replaceState(null, "", window.location.pathname)
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session?.user) {
        setState({ status: "unauthenticated" })
        return
      }

      setState({
        status: "authenticated",
        userId: session.user.id,
        email: session.user.email ?? "",
      })
    }

    check()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (cancelled) return

      if (!session?.user) {
        setState({ status: "unauthenticated" })
        return
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setState({
          status: "authenticated",
          userId: session.user.id,
          email: session.user.email ?? "",
        })
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
