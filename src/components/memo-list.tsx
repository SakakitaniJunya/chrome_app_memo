import { useState } from "react"
import { Trash2, Edit2, Plus, Search, FileText, Clock, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RichEditor } from "@/components/rich-editor"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useMemos, type Memo } from "@/hooks/use-chrome-storage"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

interface MemoEditorProps {
  memo?: Memo
  onSave: (title: string, content: string) => void
  onCancel: () => void
}

function MemoEditor({ memo, onSave, onCancel }: MemoEditorProps) {
  const { t } = useI18n()
  const [title, setTitle] = useState(memo?.title || "")
  const [content, setContent] = useState(memo?.content || "")

  const handleSave = () => {
    if (content.trim()) {
      onSave(title, content)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <input
        type="text"
        placeholder={t("titleOptional")}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      />
      <RichEditor
        value={content}
        onChange={setContent}
        placeholder={t("writeYourMemo")}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!content.trim()}>
          {t("save")}
        </Button>
      </div>
    </div>
  )
}

interface MemoItemProps {
  memo: Memo
  isSelected: boolean
  isOld?: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function MemoItem({ memo, isSelected, isOld, onSelect, onEdit, onDelete }: MemoItemProps) {
  const { lang } = useI18n()

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPlainText = (markdown: string) => {
    return markdown
      .replace(/```[\s\S]*?```/g, "[code]")
      .replace(/`[^`]*`/g, "[code]")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[#*_~`>-]/g, "")
      .trim()
  }

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-colors border group",
        isSelected
          ? "bg-accent border-primary"
          : "hover:bg-muted border-transparent"
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm truncate">{memo.title}</h3>
            {isOld && (
              <span className="text-xs px-1.5 py-0.5 bg-yellow-500/20 text-yellow-700 dark:text-yellow-500 rounded shrink-0">
                Old
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {getPlainText(memo.content)}
          </p>
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(memo.updatedAt)}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MermaidLink() {
  const { t } = useI18n()

  return (
    <a
      href="https://mermaid.js.org/intro/"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="currentColor"
      >
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
      </svg>
      {t("mermaidDocs")}
      <ExternalLink className="h-3 w-3" />
    </a>
  )
}

export function MemoList() {
  const { t } = useI18n()
  const { memos, addMemo, updateMemo, deleteMemo, isLoading, getStorageInfo } = useMemos()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const storageInfo = getStorageInfo()
  const oldestMemos = [...memos]
    .sort((a, b) => a.updatedAt - b.updatedAt)
    .slice(0, 3)
    .map(m => m.id)
  const selectedMemo = memos.find((m) => m.id === selectedId)
  const editingMemo = memos.find((m) => m.id === editingId)

  const filteredMemos = memos.filter(
    (memo) =>
      memo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreate = (title: string, content: string) => {
    const newMemo = addMemo(title, content)
    setIsCreating(false)
    setSelectedId(newMemo.id)
  }

  const handleUpdate = (title: string, content: string) => {
    if (editingId) {
      updateMemo(editingId, { title, content })
      setEditingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">{t("loading")}</div>
      </div>
    )
  }

  if (isCreating) {
    return (
      <Card className="h-full overflow-hidden flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("newMemo")}
            </CardTitle>
            <MermaidLink />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pt-4">
          <MemoEditor
            onSave={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        </CardContent>
      </Card>
    )
  }

  if (editingId && editingMemo) {
    return (
      <Card className="h-full overflow-hidden flex flex-col">
        <CardHeader className="pb-3 shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              {t("editMemo")}
            </CardTitle>
            <MermaidLink />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pt-4">
          <MemoEditor
            memo={editingMemo}
            onSave={handleUpdate}
            onCancel={() => setEditingId(null)}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Storage warning banner */}
      {storageInfo.isNearLimit && (
        <div className={cn(
          "p-3 rounded-lg border flex items-start gap-2 text-sm",
          storageInfo.isOverLimit
            ? "bg-destructive/10 border-destructive text-destructive"
            : "bg-yellow-500/10 border-yellow-500 text-yellow-700 dark:text-yellow-500"
        )}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="font-medium">
              {storageInfo.isOverLimit
                ? t("storageOverLimit")
                : t("storageNearLimit")}
            </p>
            <p className="text-xs opacity-90">
              {t("storageUsage")}: {storageInfo.sizeInBytes.toLocaleString()} / {storageInfo.maxSize.toLocaleString()} bytes ({Math.round(storageInfo.usagePercent)}%)
            </p>
            <p className="text-xs opacity-90">
              {t("deleteOldMemos")}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={t("searchMemos")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
        <Button size="sm" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {filteredMemos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm">
            {searchQuery ? t("noMemosFound") : t("noMemosYet")}
          </p>
          {!searchQuery && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setIsCreating(true)}
              className="mt-2"
            >
              {t("createFirstMemo")}
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-auto space-y-2">
          {filteredMemos.map((memo) => (
            <MemoItem
              key={memo.id}
              memo={memo}
              isSelected={selectedId === memo.id}
              isOld={storageInfo.isNearLimit && oldestMemos.includes(memo.id)}
              onSelect={() => setSelectedId(memo.id)}
              onEdit={() => setEditingId(memo.id)}
              onDelete={() => {
                deleteMemo(memo.id)
                if (selectedId === memo.id) setSelectedId(null)
              }}
            />
          ))}
        </div>
      )}

      {selectedMemo && !editingId && (
        <Card className="border-t mt-auto max-h-[45%] flex flex-col">
          <CardHeader className="pb-2 pt-4 shrink-0">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base">{selectedMemo.title}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditingId(selectedMemo.id)}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => {
                    deleteMemo(selectedMemo.id)
                    setSelectedId(null)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-4 overflow-auto flex-1">
            <MarkdownRenderer content={selectedMemo.content} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
