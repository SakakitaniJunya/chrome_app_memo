import { useState, useEffect } from "react"
import { Settings } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { MemoList } from "@/components/memo-list"
import { SearchModal } from "@/components/search-modal"
import { SyncControl } from "@/components/sync-control"
import { UserBadge } from "@/components/user-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { I18nProvider, useI18n } from "@/lib/i18n"
import type { Memo } from "@/hooks/use-chrome-storage"

type TabValue = "memos" | "settings"

function AppContent() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<TabValue>("memos")
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "p") {
        e.preventDefault()
        setSearchOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handleSelectMemo = (memo: Memo) => {
    setActiveTab("memos")
    window.dispatchEvent(new CustomEvent("colason:select-memo", { detail: { id: memo.id } }))
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={handleSelectMemo}
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabValue)}
        className="flex-1 flex flex-col"
      >
        <div className="border-b px-4 py-2 flex items-center justify-between shrink-0 gap-2">
          <TabsList className="h-9">
            <TabsTrigger value="memos" className="text-xs">
              {t("memos")}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">
              <Settings className="h-3.5 w-3.5 mr-1" />
              {t("settings")}
            </TabsTrigger>
          </TabsList>
          <UserBadge onOpenSync={() => setActiveTab("settings")} />
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

            <div id="sync-section" className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">{t("sync")}</h2>
              <SyncControl />
            </div>

            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">{t("about")}</h2>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t("aboutDescription")}</p>
                <p>{t("features")}</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>{t("featureMarkdown")}</li>
                  <li>{t("featureMermaid")}</li>
                  <li>{t("featureTables")}</li>
                  <li>{t("featureTaskLists")}</li>
                  <li>{t("featureCode")}</li>
                  <li>{t("featureDarkMode")}</li>
                  <li>{t("featureAccentColors")}</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h2 className="text-lg font-semibold mb-4">{t("keyboardShortcuts")}</h2>
              <div className="space-y-2 text-sm">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("indent")}</span>
                  <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd>
                </div>
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
      <ThemeProvider
        defaultTheme="system"
        defaultAccent="default"
        defaultWidth="large"
        defaultHeight="large"
      >
        <AppContent />
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
