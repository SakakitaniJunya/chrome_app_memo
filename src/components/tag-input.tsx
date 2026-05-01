import { useMemo, useRef, useState, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { normalizeTag, tagKey, type TagSummary } from "@/hooks/use-chrome-storage"

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  /** All known tags across the workspace, used for inline suggestions. */
  suggestions?: TagSummary[]
  className?: string
}

/**
 * Chip-style tag input. Supports adding via Enter/comma, removing via
 * backspace on empty input or clicking the chip's close icon.
 * Suggestion list is filtered against the current draft and excludes
 * already-selected tags (case-insensitive).
 */
export function TagInput({ value, onChange, suggestions = [], className }: TagInputProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState("")
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedKeys = useMemo(() => new Set(value.map(tagKey)), [value])

  const filteredSuggestions = useMemo(() => {
    const draftKey = draft.trim().toLowerCase()
    return suggestions
      .filter((s) => !selectedKeys.has(s.key))
      .filter((s) => (draftKey ? s.key.includes(draftKey) : true))
      .slice(0, 8)
  }, [suggestions, selectedKeys, draft])

  const commit = (raw: string) => {
    const normalized = normalizeTag(raw)
    if (!normalized) {
      setDraft("")
      return
    }
    if (selectedKeys.has(tagKey(normalized))) {
      setDraft("")
      return
    }
    onChange([...value, normalized])
    setDraft("")
  }

  const remove = (tag: string) => {
    const key = tagKey(tag)
    onChange(value.filter((t) => tagKey(t) !== key))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      if (!draft.trim()) return
      e.preventDefault()
      commit(draft)
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      e.preventDefault()
      remove(value[value.length - 1]!)
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tagKey(tag)}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              aria-label={t("removeTag")}
              className="hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                remove(tag)
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            // Commit on blur so the user doesn't lose a half-typed tag.
            if (draft.trim()) commit(draft)
          }}
          placeholder={value.length === 0 ? t("addTag") : ""}
          className="flex-1 min-w-[6rem] bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filteredSuggestions.map((s) => (
            <button
              type="button"
              key={s.key}
              // Use mousedown so the option triggers before the input loses focus.
              onMouseDown={(e) => {
                e.preventDefault()
                commit(s.tag)
              }}
              className="flex w-full items-center justify-between px-3 py-1.5 text-sm hover:bg-accent"
            >
              <span>{s.tag}</span>
              <span className="text-xs text-muted-foreground">{s.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
