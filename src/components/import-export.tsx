import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { useMemos, type Memo } from "@/hooks/use-chrome-storage"
import { useI18n } from "@/lib/i18n"
import { Button } from "@/components/ui/button"

function dateStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function memosToMarkdown(memos: Memo[]): string {
  return memos
    .map((m) => {
      const front = [
        "---",
        `id: ${m.id}`,
        `title: ${m.title}`,
        `createdAt: ${m.createdAt}`,
        `updatedAt: ${m.updatedAt}`,
        "---",
        "",
      ].join("\n")
      return front + m.content
    })
    .join("\n\n---colason-separator---\n\n")
}

function parseMemoFromMarkdown(text: string, filename: string): Omit<Memo, "id"> & { id?: string } {
  const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/m)
  if (frontmatterMatch) {
    const meta = frontmatterMatch[1]
    const content = frontmatterMatch[2].trim()
    const id = meta.match(/id: (.+)/)?.[1]
    const title = meta.match(/title: (.+)/)?.[1] ?? filename.replace(/\.md$/, "")
    const createdAt = Number(meta.match(/createdAt: (\d+)/)?.[1] ?? Date.now())
    const updatedAt = Number(meta.match(/updatedAt: (\d+)/)?.[1] ?? Date.now())
    return { id, title, content, createdAt, updatedAt }
  }
  // No frontmatter: extract title from first H1 or use filename
  const h1Match = text.match(/^#\s+(.+)$/m)
  const title = h1Match ? h1Match[1].trim() : filename.replace(/\.md$/, "")
  const content = h1Match ? text.replace(/^#\s+.+\n?/, "").trim() : text.trim()
  return { title, content, createdAt: Date.now(), updatedAt: Date.now() }
}

export function ImportExport() {
  const { memos, addMemo } = useMemos()
  const { t } = useI18n()
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const mdInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)

  function exportJson() {
    const json = JSON.stringify(memos, null, 2)
    downloadBlob(json, `colason-export-${dateStr()}.json`, "application/json")
  }

  function exportMarkdown() {
    const md = memosToMarkdown(memos)
    downloadBlob(md, `colason-export-${dateStr()}.md`, "text/markdown")
  }

  async function importJson(file: File) {
    try {
      const text = await file.text()
      const parsed: unknown = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error("Expected JSON array")

      const existingIds = new Set(memos.map((m) => m.id))
      let added = 0
      for (const item of parsed) {
        if (
          typeof item !== "object" ||
          item === null ||
          typeof (item as Memo).title !== "string" ||
          typeof (item as Memo).content !== "string"
        )
          continue
        const memo = item as Memo
        if (existingIds.has(memo.id)) continue
        addMemo(memo.title, memo.content)
        existingIds.add(memo.id)
        added++
      }
      setStatus(t("importSuccessJson").replace("{n}", String(added)))
    } catch (e) {
      setStatus(t("importError"))
      console.error("[colason] import JSON failed", e)
    }
  }

  async function importMarkdown(files: FileList) {
    const existingTitles = new Set(memos.map((m) => m.title))
    const existingIds = new Set(memos.map((m) => m.id))
    let added = 0

    for (const file of Array.from(files)) {
      const text = await file.text()
      if (text.includes("---colason-separator---")) {
        // Multi-memo exported .md
        for (const section of text.split("---colason-separator---")) {
          const trimmed = section.trim()
          if (!trimmed) continue
          const parsed = parseMemoFromMarkdown(trimmed, file.name)
          if (parsed.id && existingIds.has(parsed.id)) continue
          if (!parsed.id && existingTitles.has(parsed.title)) continue
          addMemo(parsed.title, parsed.content)
          existingTitles.add(parsed.title)
          if (parsed.id) existingIds.add(parsed.id)
          added++
        }
      } else {
        const parsed = parseMemoFromMarkdown(text, file.name)
        if (parsed.id && existingIds.has(parsed.id)) continue
        if (!parsed.id && existingTitles.has(parsed.title)) continue
        addMemo(parsed.title, parsed.content)
        existingTitles.add(parsed.title)
        if (parsed.id) existingIds.add(parsed.id)
        added++
      }
    }
    setStatus(t("importSuccessMd").replace("{n}", String(added)))
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground mb-3">{t("importExportDesc")}</p>

        <div className="space-y-2">
          <p className="text-sm font-medium">{t("exportLabel")}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportJson} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportMarkdown} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Markdown
            </Button>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <p className="text-sm font-medium">{t("importLabel")}</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => jsonInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => mdInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Markdown
            </Button>
          </div>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void importJson(file)
              e.target.value = ""
            }}
          />
          <input
            ref={mdInputRef}
            type="file"
            accept=".md"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files
              if (files && files.length > 0) void importMarkdown(files)
              e.target.value = ""
            }}
          />
        </div>

        {status && (
          <p className="mt-3 text-xs text-muted-foreground">{status}</p>
        )}
      </div>
    </div>
  )
}
