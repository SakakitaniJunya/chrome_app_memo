import { useEffect, useState } from "react"
import {
  isFirebaseConfigured,
  onAuthChanged,
  silentSignInWithChromeIdentity,
  type User,
} from "@/lib/firebase"

interface AuthState {
  user: User | null
  isReady: boolean
  isConfigured: boolean
}

export function useAuth(): AuthState {
  const configured = isFirebaseConfigured()
  const [user, setUser] = useState<User | null>(null)
  const [isReady, setIsReady] = useState(!configured)

  useEffect(() => {
    if (!configured) {
      setIsReady(true)
      return
    }
    const unsub = onAuthChanged((u) => {
      setUser(u)
      setIsReady(true)
      // If we don't have a user yet, attempt a non-interactive sign-in
      // using the cached chrome.identity token. This is what makes the
      // experience "auto sign-in" for users already consented before.
      if (u === null) {
        void silentSignInWithChromeIdentity()
      }
    })
    return () => unsub()
  }, [configured])

  return { user, isReady, isConfigured: configured }
}
