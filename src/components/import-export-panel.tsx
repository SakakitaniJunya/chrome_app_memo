import { useRef, useState } from "react"
import { Download, FileJson, FileArchive, Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useMemos } from "@/hooks/use-chrome-storage"
import {
  buildJsonExport,
  buildMarkdownZipExport,
  importFromFile,
  triggerDownload,
} from "@/lib/import-export"
import { useI18n } from "@/lib/i18n"

type Status =
  | { kind: "idle" }
  | { kind: "working"; message: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }

function formatStamp(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${now.getFullYear()}` +
    `${pad(now.getMonth() + 1)}` +
    `${pad(now.getDate())}` +
    `-` +
    `${pad(now.getHours())}` +
    `${pad(now.getMinutes())}`
  )
}

export function ImportExportPanel() {
  const { t } = useI18n()
  const { memos, mergeMemos } = useMemos()
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleExportJson = () => {
    try {
      const blob = buildJsonExport(memos)
      triggerDownload(blob, `colason-memos-${formatStamp(new Date())}.json`)
      setStatus({
        kind: "success",
        message: t("exportSuccessJson").replace("{count}", String(memos.length)),
      })
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handleExportZip = async () => {
    setStatus({ kind: "working", message: t("exporting") })
    try {
      const blob = await buildMarkdownZipExport(memos)
      triggerDownload(blob, `colason-memos-${formatStamp(new Date())}.zip`)
      setStatus({
        kind: "success",
        message: t("exportSuccessZip").replace("{count}", String(memos.length)),
      })
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) })
    }
  }

  const handlePickFiles = () => {
    fileInputRef.current?.click()
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setStatus({ kind: "working", message: t("importing") })
    try {
      const all = []
      const errs = []
      for (const file of Array.from(files)) {
        const res = await importFromFile(file)
        all.push(...res.memos)
        errs.push(...res.errors)
      }
      if (all.length === 0 && errs.length > 0) {
        setStatus({
          kind: "error",
          message: `${t("importFailed")}: ${errs[0]?.message ?? "unknown"}`,
        })
        return
      }
      const summary = mergeMemos(all)
      const baseMsg = t("importSuccess")
        .replace("{added}", String(summary.added))
        .replace("{updated}", String(summary.updated))
        .replace("{skipped}", String(summary.skipped))
      const tail = errs.length > 0 ? ` (${errs.length} ${t("importErrorsSuffix")})` : ""
      setStatus({ kind: "success", message: baseMsg + tail })
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : String(e) })
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{t("exportSection")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("exportHint")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportJson}
          disabled={memos.length === 0 || status.kind === "working"}
        >
          <FileJson className="h-4 w-4 mr-2" />
          {t("exportJson")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExportZip}
          disabled={memos.length === 0 || status.kind === "working"}
        >
          <FileArchive className="h-4 w-4 mr-2" />
          {t("exportMarkdownZip")}
        </Button>
      </div>

      <div className="pt-4 border-t flex items-center gap-2">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">{t("importSection")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("importHint")}</p>
      <div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".json,.md,.markdown,.txt,.zip,application/json,text/markdown,application/zip"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePickFiles}
          disabled={status.kind === "working"}
        >
          <Upload className="h-4 w-4 mr-2" />
          {t("chooseFiles")}
        </Button>
      </div>

      {status.kind !== "idle" && (
        <div
          role="status"
          className={
            "text-xs flex items-start gap-2 rounded-md border p-2 " +
            (status.kind === "error"
              ? "border-destructive/50 text-destructive"
              : status.kind === "success"
                ? "border-green-600/40 text-green-700 dark:text-green-400"
                : "border-border text-muted-foreground")
          }
        >
          {status.kind === "error" ? (
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          ) : status.kind === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          ) : null}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  )
}
