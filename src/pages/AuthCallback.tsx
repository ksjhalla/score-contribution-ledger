import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/integrations/supabase/client"
import { consumePostAuthRedirect } from "@/lib/postAuthRedirect"

const AuthCallback = () => {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        const dest = consumePostAuthRedirect() ?? "/dashboard"
        window.history.replaceState(null, "", dest)
        navigate(dest, { replace: true })
      } else {
        navigate("/auth", { replace: true })
      }
    })
  }, [navigate])

  return <div style={{ minHeight: "100vh", background: "#F5F1E8" }} />
}

export default AuthCallback
