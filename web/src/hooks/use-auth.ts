import { useEffect, useState } from "react"
import { isFirebaseConfigured, onAuthChanged, type User } from "../lib/firebase"

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
    })
    return () => unsub()
  }, [configured])

  return { user, isReady, isConfigured: configured }
}
