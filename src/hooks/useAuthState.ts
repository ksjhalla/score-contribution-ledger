import { useEffect, useState } from "react"
import { supabase } from "@/integrations/supabase/client"

type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; userId: string; email: string; hasProfile: boolean }

export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function check() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (!session?.user) {
        setState({ status: "unauthenticated" })
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("contributor_id")
        .eq("id", session.user.id)
        .maybeSingle()

      if (cancelled) return

      setState({
        status: "authenticated",
        userId: session.user.id,
        email: session.user.email ?? "",
        hasProfile: !!(profile?.contributor_id),
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
        await check()
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
