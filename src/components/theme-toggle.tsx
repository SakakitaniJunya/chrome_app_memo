import { Moon, Sun, Monitor, Palette, MoveHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme, type Theme, type AccentColor, type SizeOption } from "@/components/theme-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useI18n } from "@/lib/i18n"

export function ThemeToggle() {
  const { theme, setTheme, accent, setAccent, width, setWidth } = useTheme()
  const { t } = useI18n()

  const themes: { value: Theme; labelKey: "light" | "dark" | "system"; icon: React.ReactNode }[] = [
    { value: "light", labelKey: "light", icon: <Sun className="h-4 w-4" /> },
    { value: "dark", labelKey: "dark", icon: <Moon className="h-4 w-4" /> },
    { value: "system", labelKey: "system", icon: <Monitor className="h-4 w-4" /> },
  ]

  const accents: { value: AccentColor; labelKey: "default" | "blue" | "green" | "purple" | "orange" | "rose"; color: string }[] = [
    { value: "default", labelKey: "default", color: "bg-slate-900 dark:bg-slate-100" },
    { value: "blue", labelKey: "blue", color: "bg-blue-500" },
    { value: "green", labelKey: "green", color: "bg-green-500" },
    { value: "purple", labelKey: "purple", color: "bg-purple-500" },
    { value: "orange", labelKey: "orange", color: "bg-orange-500" },
    { value: "rose", labelKey: "rose", color: "bg-rose-500" },
  ]

  const widthOptions: { value: SizeOption; label: string; size: string }[] = [
    { value: "small", label: "S", size: "450px" },
    { value: "medium", label: "M", size: "600px" },
    { value: "large", label: "L", size: "800px" },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Sun className="h-4 w-4" />
          {t("theme")}
        </label>
        <div className="flex gap-2">
          {themes.map((themeOption) => (
            <Button
              key={themeOption.value}
              variant={theme === themeOption.value ? "default" : "outline"}
              size="sm"
              onClick={() => setTheme(themeOption.value)}
              className="flex items-center gap-2"
            >
              {themeOption.icon}
              {t(themeOption.labelKey)}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <Palette className="h-4 w-4" />
          {t("accentColor")}
        </label>
        <Select value={accent} onValueChange={(value) => setAccent(value as AccentColor)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("accentColor")} />
          </SelectTrigger>
          <SelectContent>
            {accents.map((a) => (
              <SelectItem key={a.value} value={a.value}>
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${a.color}`} />
                  {t(a.labelKey)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-2">
          <MoveHorizontal className="h-4 w-4" />
          {t("popupWidth")}
        </label>
        <div className="flex gap-1">
          {widthOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={width === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => setWidth(opt.value)}
              className="flex-1 flex flex-col items-center gap-0 h-auto py-1.5"
            >
              <span className="font-medium text-xs">{opt.label}</span>
              <span className="text-[10px] opacity-70">{opt.size}</span>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("reopenToApply")}
        </p>
      </div>
    </div>
  )
}
