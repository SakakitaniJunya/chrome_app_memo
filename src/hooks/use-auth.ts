import { useEffect, useState } from "react"
import {
  isGcpAuthSupported,
  onAuthChanged,
  silentSignIn,
  type GcpUser,
} from "@/lib/gcp-auth"

interface AuthState {
  user: GcpUser | null
  isReady: boolean
  isConfigured: boolean
}

export function useAuth(): AuthState {
  const configured = isGcpAuthSupported()
  const [user, setUser] = useState<GcpUser | null>(null)
  const [isReady, setIsReady] = useState(!configured)

  useEffect(() => {
    if (!configured) {
      setIsReady(true)
      return
    }
    let cancelled = false

    const unsub = onAuthChanged((u) => {
      if (cancelled) return
      setUser(u)
      setIsReady(true)
    })

    // Attempt non-interactive sign-in on mount so users who already
    // consented don't need to click again.
    void silentSignIn()

    return () => {
      cancelled = true
      unsub()
    }
  }, [configured])

  return { user, isReady, isConfigured: configured }
}
