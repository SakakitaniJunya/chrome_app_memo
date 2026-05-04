import { useState } from "react"
import { CloudOff, Cloud, LogIn, LogOut, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { signInInteractive, signOut } from "@/lib/gcp-auth"
import { useI18n } from "@/lib/i18n"

export function SyncControl() {
  const { user, isReady, isConfigured } = useAuth()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)

  const handleSignIn = async () => {
    setBusy(true)
    try {
      await signInInteractive()
    } catch (err) {
      console.error("[colason] sign-in failed", err)
    } finally {
      setBusy(false)
    }
  }

  const handleSignOut = async () => {
    setBusy(true)
    try {
      await signOut()
    } catch (err) {
      console.error("[colason] sign-out failed", err)
    } finally {
      setBusy(false)
    }
  }

  if (!isConfigured) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <CloudOff className="h-4 w-4" />
          {t("sync")}
        </label>
        <p className="text-xs text-muted-foreground">{t("syncDisabled")}</p>
        <p className="text-xs text-muted-foreground">{t("syncDisabledHint")}</p>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("sync")}
        </label>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        {user ? (
          <Cloud className="h-4 w-4 text-green-600" />
        ) : (
          <CloudOff className="h-4 w-4 text-muted-foreground" />
        )}
        {t("sync")}
      </label>
      {user ? (
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground truncate flex-1">
            {t("syncSignedIn")} — {user.email ?? user.sub}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSignOut}
            disabled={busy}
            className="flex items-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            {t("signOut")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-muted-foreground">{t("syncSignedOut")}</p>
          <Button
            size="sm"
            onClick={handleSignIn}
            disabled={busy}
            className="flex items-center gap-2 w-full"
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <LogIn className="h-3.5 w-3.5" />
            )}
            {t("signInWithGoogle")}
          </Button>
        </div>
      )}
    </div>
  )
}
