import { useEffect, useMemo, useRef, useState } from "react"
import Fuse, { type FuseResult } from "fuse.js"
import { Search, FileText } from "lucide-react"
import type { Memo } from "@/hooks/use-chrome-storage"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface QuickSwitcherProps {
  isOpen: boolean
  memos: Memo[]
  onClose: () => void
  onSelect: (memoId: string) => void
}

// Strip basic markdown noise so previews and search look clean.
function getPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#*_~>`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

const MAX_RESULTS = 50

export function QuickSwitcher({ isOpen, memos, onClose, onSelect }: QuickSwitcherProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // Build a Fuse index over title + plain-text body. We rebuild whenever
  // the memo list changes; for typical memo counts (hundreds) this is cheap.
  const fuse = useMemo(() => {
    const docs = memos.map((m) => ({
      id: m.id,
      title: m.title || "",
      body: getPlainText(m.content || ""),
      updatedAt: m.updatedAt,
      memo: m,
    }))
    return new Fuse(docs, {
      keys: [
        { name: "title", weight: 0.7 },
        { name: "body", weight: 0.3 },
      ],
      // Substring + fuzzy. Fuse normalizes case by default.
      // ignoreLocation lets matches anywhere in the field count equally,
      // which is important for Japanese (no word boundaries).
      includeMatches: true,
      includeScore: true,
      ignoreLocation: true,
      threshold: 0.4,
      minMatchCharLength: 1,
    })
  }, [memos])

  // Compute results. Empty query -> show recent memos (most recently updated).
  const results = useMemo<Array<{ memo: Memo; score?: number }>>(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      return [...memos]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_RESULTS)
        .map((memo) => ({ memo }))
    }
    const matches: FuseResult<{ memo: Memo }>[] = fuse.search(trimmed, {
      limit: MAX_RESULTS,
    }) as unknown as FuseResult<{ memo: Memo }>[]
    return matches.map((m) => ({ memo: m.item.memo, score: m.score }))
  }, [query, memos, fuse])

  // Reset state whenever the modal opens; focus the input.
  useEffect(() => {
    if (!isOpen) return
    setQuery("")
    setActiveIndex(0)
    // Defer focus to next tick so the element is mounted.
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [isOpen])

  // Clamp active index when results change.
  useEffect(() => {
    setActiveIndex((idx) => {
      if (results.length === 0) return 0
      if (idx >= results.length) return results.length - 1
      return idx
    })
  }, [results])

  // Scroll the active item into view as the user navigates.
  useEffect(() => {
    if (!isOpen) return
    const list = listRef.current
    if (!list) return
    const el = list.querySelector<HTMLElement>(`[data-qs-index="${activeIndex}"]`)
    if (el) {
      el.scrollIntoView({ block: "nearest" })
    }
  }, [activeIndex, isOpen])

  if (!isOpen) return null

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(results.length - 1, i + 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(0, i - 1))
      return
    }
    if (e.key === "Enter") {
      e.preventDefault()
      const picked = results[activeIndex]
      if (picked) {
        onSelect(picked.memo.id)
        onClose()
      }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("quickSearch")}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm pt-[10vh] px-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-xl bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("quickSearchPlaceholder")}
            aria-label={t("quickSearchPlaceholder")}
            className="flex-1 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline px-1.5 py-0.5 bg-muted text-muted-foreground rounded text-[10px]">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-auto">
          {memos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <FileText className="h-8 w-8 opacity-50" />
              <p className="text-sm">{t("quickSearchEmpty")}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
              <Search className="h-8 w-8 opacity-50" />
              <p className="text-sm">{t("quickSearchNoResults")}</p>
            </div>
          ) : (
            results.map((r, i) => {
              const memo = r.memo
              const preview = getPlainText(memo.content)
              return (
                <button
                  type="button"
                  key={memo.id}
                  data-qs-index={i}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => {
                    onSelect(memo.id)
                    onClose()
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 flex flex-col gap-0.5 border-l-2 transition-colors",
                    i === activeIndex
                      ? "bg-accent border-primary"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <span className="text-sm font-medium truncate">
                    {memo.title || "Untitled"}
                  </span>
                  {preview && (
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {preview}
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>

        <div className="border-t px-3 py-1.5 text-[11px] text-muted-foreground flex items-center justify-between">
          <span>{t("quickSearchHint")}</span>
          <span className="hidden sm:inline">
            <kbd className="px-1 py-0.5 bg-muted rounded">↑↓</kbd>{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
