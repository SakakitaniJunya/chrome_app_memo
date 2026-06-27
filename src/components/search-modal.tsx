import { useState, useEffect, useRef } from "react"
import { Search, FileText } from "lucide-react"
import { useMemos, type Memo } from "@/hooks/use-chrome-storage"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

const UNTITLED = "(無題)"

interface SearchModalProps {
  open: boolean
  onClose: () => void
  onSelect: (memo: Memo) => void
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text
  const lower = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const idx = lower.indexOf(lowerQuery)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/30 text-foreground rounded-sm">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

function getSnippet(content: string, query: string, maxLen = 80): string {
  const plain = content
    .replace(/```[\s\S]*?```/g, "[code]")
    .replace(/`[^`]*`/g, "[code]")
    .replace(/[#*_~`>-]/g, "")
    .trim()
  if (!query) return plain.slice(0, maxLen)
  const lower = plain.toLowerCase()
  const idx = lower.indexOf(query.toLowerCase())
  if (idx === -1) return plain.slice(0, maxLen)
  const start = Math.max(0, idx - 20)
  const snippet = plain.slice(start, start + maxLen)
  return (start > 0 ? "…" : "") + snippet
}

export function SearchModal({ open, onClose, onSelect }: SearchModalProps) {
  const { t } = useI18n()
  const { memos } = useMemos()
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = memos.filter(
    (m) =>
      m.title.toLowerCase().includes(query.toLowerCase()) ||
      m.content.toLowerCase().includes(query.toLowerCase())
  )

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIdx(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === "Escape") { onClose(); return }
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
      if (e.key === "Enter") {
        const memo = filtered[activeIdx]
        if (memo) { onSelect(memo); onClose() }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, filtered, activeIdx, onClose, onSelect])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        aria-hidden
      />
      <div
        className="relative w-full max-w-md bg-background border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-3 border-b">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("searchMemos")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">esc</kbd>
        </div>

        <div className="max-h-72 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <FileText className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">{query ? t("noMemosFound") : t("noMemosYet")}</p>
            </div>
          ) : (
            filtered.map((memo, i) => (
              <button
                key={memo.id}
                className={cn(
                  "w-full text-left px-4 py-3 transition-colors border-b last:border-b-0",
                  i === activeIdx ? "bg-accent" : "hover:bg-muted"
                )}
                onMouseEnter={() => setActiveIdx(i)}
                onClick={() => { onSelect(memo); onClose() }}
              >
                <p className="text-sm font-medium truncate">
                  {highlight(memo.title || UNTITLED, query)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                  {highlight(getSnippet(memo.content, query), query)}
                </p>
              </button>
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-3 py-2 border-t text-xs text-muted-foreground flex gap-3">
            <span>↑↓ 移動</span>
            <span>↵ 選択</span>
            <span>esc 閉じる</span>
          </div>
        )}
      </div>
    </div>
  )
}
