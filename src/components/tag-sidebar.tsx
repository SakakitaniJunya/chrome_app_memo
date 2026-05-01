import { Hash, Settings2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n"
import { tagKey, type TagSummary } from "@/hooks/use-chrome-storage"

interface TagSidebarProps {
  tags: TagSummary[]
  totalCount: number
  untaggedCount: number
  /** null = "All", "__untagged__" = sentinel for untagged filter. */
  activeKey: string | null
  onSelect: (key: string | null) => void
  onManage: () => void
}

/** Special filter value representing memos that have no tags. */
export const UNTAGGED_KEY = "__untagged__"

/**
 * Vertical sidebar that lists every tag with its memo count.
 * Acts as a filter — clicking a tag activates it, clicking the active
 * tag (or the All entry) resets the filter.
 */
export function TagSidebar({
  tags,
  totalCount,
  untaggedCount,
  activeKey,
  onSelect,
  onManage,
}: TagSidebarProps) {
  const { t } = useI18n()

  return (
    <aside className="w-44 shrink-0 flex flex-col border rounded-lg bg-muted/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Tag className="h-3.5 w-3.5" />
          {t("tags")}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onManage}
          title={t("manageTags")}
          aria-label={t("manageTags")}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex-1 overflow-auto py-1">
        <SidebarItem
          label={t("allMemos")}
          count={totalCount}
          isActive={activeKey === null}
          onClick={() => onSelect(null)}
        />
        {untaggedCount > 0 && (
          <SidebarItem
            label={t("untagged")}
            count={untaggedCount}
            isActive={activeKey === UNTAGGED_KEY}
            onClick={() =>
              onSelect(activeKey === UNTAGGED_KEY ? null : UNTAGGED_KEY)
            }
            italic
          />
        )}
        {tags.length > 0 && (
          <div className="my-1 mx-3 border-t" />
        )}
        {tags.map((s) => {
          const isActive = activeKey === s.key
          return (
            <SidebarItem
              key={s.key}
              label={s.tag}
              count={s.count}
              isActive={isActive}
              onClick={() => onSelect(isActive ? null : s.key)}
              showHash
            />
          )
        })}
        {tags.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground italic">
            {t("noTagsYet")}
          </p>
        )}
      </div>
    </aside>
  )
}

interface SidebarItemProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  showHash?: boolean
  italic?: boolean
}

function SidebarItem({
  label,
  count,
  isActive,
  onClick,
  showHash,
  italic,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-xs text-left transition-colors",
        isActive
          ? "bg-primary/15 text-primary font-medium"
          : "hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <span className={cn("flex items-center gap-1 truncate", italic && "italic")}>
        {showHash && <Hash className="h-3 w-3 shrink-0 opacity-60" />}
        <span className="truncate">{label}</span>
      </span>
      <span
        className={cn(
          "shrink-0 rounded px-1.5 text-[10px] tabular-nums",
          isActive ? "bg-primary/20" : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  )
}

/** Helper: derive the active tag's display name from the summaries. */
export function findActiveTagDisplay(
  tags: TagSummary[],
  activeKey: string | null
): string | null {
  if (activeKey === null) return null
  if (activeKey === UNTAGGED_KEY) return null
  const found = tags.find((t) => tagKey(t.tag) === activeKey)
  return found ? found.tag : null
}
