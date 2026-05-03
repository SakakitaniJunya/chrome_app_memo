import { useEffect } from "react"
import { Plus, Settings } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { MemoList } from "@/components/memo-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { I18nProvider, useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { useNewMemoShortcut } from "./use-new-memo-shortcut"
import { SyncSettings } from "./components/sync-settings"

function AppContent() {
  const { t } = useI18n()
  const { trigger: triggerNewMemo } = useNewMemoShortcut()

  useEffect(() => {
    document.title = "Colason"
  }, [])

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="titlebar">
        <span>{t("appName")}</span>
        <div className="titlebar-actions">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={triggerNewMemo}
            title="New memo (Cmd/Ctrl + N)"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
        </div>
      </div>

      <Tabs defaultValue="memos" className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2 flex items-center justify-between shrink-0">
          <TabsList className="h-9">
            <TabsTrigger value="memos" className="text-xs">
              {t("memos")}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-3.5 w-3.5 mr-1" />
              {t("settings")}
            </TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">PWA</div>
        </div>

        <TabsContent value="memos" className="flex-1 p-4 mt-0 overflow-hidden">
          <MemoList />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-4 mt-0 overflow-auto">
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-4">{t("appearance")}</h2>
              <ThemeToggle />
            </div>

            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">{t("keyboardShortcuts")}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New memo</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd/Ctrl + N</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("bold")}</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd/Ctrl + B</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("italic")}</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd/Ctrl + I</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("link")}</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Cmd/Ctrl + K</kbd>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">{t("sync")}</h2>
              <SyncSettings />
            </div>

            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">{t("about")}</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Colason Web Window (PWA standalone).</p>
                <p>Sign in with Google to sync memos across devices.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider defaultTheme="system" defaultAccent="default">
        <AppContent />
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
