import { useState } from "react"
import { Cloud, CloudOff, LogIn, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useAuth } from "../hooks/use-auth"
import { signInWithGoogle, signOutUser } from "../lib/firebase"

export function SyncSettings() {
  const { t } = useI18n()
  const { user, isReady, isConfigured } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    setBusy(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    setError(null)
    try {
      await signOutUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          <span className="font-medium">{t("syncDisabled")}</span>
        </div>
        <p className="text-xs">{t("syncDisabledHint")}</p>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="text-sm text-muted-foreground">{t("loading")}</div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <CloudOff className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{t("syncSignedOut")}</span>
        </div>
        <Button size="sm" onClick={handleSignIn} disabled={busy}>
          <LogIn className="h-3.5 w-3.5 mr-1.5" />
          {t("signInWithGoogle")}
        </Button>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <Cloud className="h-4 w-4 text-green-600" />
        <span className="font-medium">{t("syncSignedIn")}</span>
      </div>
      <div className="text-xs text-muted-foreground space-y-1">
        <div>{user.email ?? user.uid}</div>
        {user.displayName && <div>{user.displayName}</div>}
      </div>
      <Button size="sm" variant="outline" onClick={handleSignOut} disabled={busy}>
        <LogOut className="h-3.5 w-3.5 mr-1.5" />
        {t("signOut")}
      </Button>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}
