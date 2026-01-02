import { Settings } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { MemoList } from "@/components/memo-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { I18nProvider, useI18n } from "@/lib/i18n"

function AppContent() {
  const { t } = useI18n()

  return (
    <div className="h-screen flex flex-col bg-background">
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
          <div className="text-xs text-muted-foreground">
            {t("appName")}
          </div>
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
      <ThemeProvider defaultTheme="system" defaultAccent="default">
        <AppContent />
      </ThemeProvider>
    </I18nProvider>
  )
}

export default App
