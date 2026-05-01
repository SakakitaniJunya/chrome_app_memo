import { useEffect, useMemo, useState } from "react"
import { Check, GitMerge, Pencil, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import {
  normalizeTag,
  tagKey,
  type TagSummary,
} from "@/hooks/use-chrome-storage"

interface TagManageDialogProps {
  open: boolean
  tags: TagSummary[]
  onClose: () => void
  onRename: (from: string, to: string) => void
  onMerge: (sources: string[], target: string) => void
  onDelete: (tag: string) => void
}

/**
 * Modal-style overlay for renaming, merging, and deleting tags.
 * Implemented with plain divs (no extra dialog primitive dependency).
 * Operations are confirmed by the user before they fire.
 */
export function TagManageDialog({
  open,
  tags,
  onClose,
  onRename,
  onMerge,
  onDelete,
}: TagManageDialogProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<"list" | "merge">("list")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState("")
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [mergeTarget, setMergeTarget] = useState("")

  // Reset internal state every time the dialog opens or the tag set changes.
  useEffect(() => {
    if (!open) {
      setMode("list")
      setEditingKey(null)
      setRenameDraft("")
      setSelectedKeys(new Set())
      setMergeTarget("")
    }
  }, [open])

  const selectedTags = useMemo(
    () => tags.filter((s) => selectedKeys.has(s.key)),
    [tags, selectedKeys]
  )

  if (!open) return null

  const startRename = (s: TagSummary) => {
    setEditingKey(s.key)
    setRenameDraft(s.tag)
  }

  const commitRename = (from: string) => {
    const next = normalizeTag(renameDraft)
    if (!next) {
      setEditingKey(null)
      return
    }
    if (tagKey(next) !== tagKey(from)) {
      onRename(from, next)
    }
    setEditingKey(null)
    setRenameDraft("")
  }

  const toggleSelect = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const performMerge = () => {
    const target = normalizeTag(mergeTarget)
    if (!target) return
    const sources = selectedTags.map((s) => s.tag)
    if (sources.length < 1) return
    onMerge(sources, target)
    setMode("list")
    setSelectedKeys(new Set())
    setMergeTarget("")
  }

  const handleDelete = (tag: string) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(t("confirmDeleteTag").replace("{tag}", tag))
      if (!ok) return
    }
    onDelete(tag)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border bg-background shadow-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{t("manageTags")}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onClose}
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div className="flex gap-1 border-b px-2 py-1.5">
          <Button
            variant={mode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("list")}
          >
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {t("renameTab")}
          </Button>
          <Button
            variant={mode === "merge" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("merge")}
            disabled={tags.length < 2}
          >
            <GitMerge className="h-3.5 w-3.5 mr-1" />
            {t("mergeTab")}
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {tags.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              {t("noTagsYet")}
            </p>
          ) : mode === "list" ? (
            <ul className="space-y-1">
              {tags.map((s) => {
                const isEditing = editingKey === s.key
                return (
                  <li
                    key={s.key}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
                  >
                    {isEditing ? (
                      <>
                        <input
                          autoFocus
                          value={renameDraft}
                          onChange={(e) => setRenameDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(s.tag)
                            if (e.key === "Escape") setEditingKey(null)
                          }}
                          className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => commitRename(s.tag)}
                          aria-label={t("save")}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => setEditingKey(null)}
                          aria-label={t("cancel")}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 truncate text-sm">{s.tag}</span>
                        <span className="rounded bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                          {s.count}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => startRename(s)}
                          aria-label={t("renameTag")}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(s.tag)}
                          aria-label={t("deleteTag")}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{t("mergeHint")}</p>
              <div className="space-y-1 max-h-56 overflow-auto border rounded-md">
                {tags.map((s) => {
                  const checked = selectedKeys.has(s.key)
                  return (
                    <label
                      key={s.key}
                      className={cn(
                        "flex items-center gap-2 px-2 py-1.5 text-sm cursor-pointer",
                        checked && "bg-primary/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(s.key)}
                      />
                      <span className="flex-1 truncate">{s.tag}</span>
                      <span className="rounded bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">
                        {s.count}
                      </span>
                    </label>
                  )
                })}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {t("mergeTargetLabel")}
                </label>
                <input
                  list="merge-target-options"
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  placeholder={t("mergeTargetPlaceholder")}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <datalist id="merge-target-options">
                  {tags.map((s) => (
                    <option key={s.key} value={s.tag} />
                  ))}
                </datalist>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setMode("list")}>
                  {t("cancel")}
                </Button>
                <Button
                  size="sm"
                  onClick={performMerge}
                  disabled={selectedTags.length < 1 || !normalizeTag(mergeTarget)}
                >
                  <GitMerge className="h-3.5 w-3.5 mr-1" />
                  {t("performMerge")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
