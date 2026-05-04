import { Cloud, CloudOff, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface UserBadgeProps {
  onOpenSync: () => void
}

// Compact auth status badge for the top-right of the popup header.
// Click to jump to Settings → Sync section.
export function UserBadge({ onOpenSync }: UserBadgeProps) {
  const { user, isReady, isConfigured } = useAuth()
  const { t } = useI18n()

  let icon: React.ReactNode
  let label: string
  let title: string
  let tone: "muted" | "ok" | "warn"

  if (!isConfigured) {
    icon = <CloudOff className="h-3.5 w-3.5" />
    label = t("syncDisabled")
    title = t("syncDisabledHint")
    tone = "warn"
  } else if (!isReady) {
    icon = <Loader2 className="h-3.5 w-3.5 animate-spin" />
    label = t("loading")
    title = t("loading")
    tone = "muted"
  } else if (user) {
    icon = <Cloud className="h-3.5 w-3.5" />
    label = user.email ?? user.name ?? user.sub
    title = t("syncSignedIn")
    tone = "ok"
  } else {
    icon = <CloudOff className="h-3.5 w-3.5" />
    label = t("syncSignedOut")
    title = t("signInWithGoogle")
    tone = "muted"
  }

  const toneClass =
    tone === "ok"
      ? "text-green-700 dark:text-green-400 hover:bg-green-500/10"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
        : "text-muted-foreground hover:bg-accent"

  return (
    <button
      type="button"
      onClick={onOpenSync}
      title={title}
      aria-label={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
        "max-w-[180px] transition-colors",
        toneClass,
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  )
}
