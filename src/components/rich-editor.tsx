import { useRef, useCallback, useState } from "react"
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Table,
  CheckSquare,
  Eye,
  PenLine,
  Columns2,
  Rows2,
  GitBranch,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { useI18n } from "@/lib/i18n"
import { cn } from "@/lib/utils"

type EditorMode = "split-horizontal" | "split-vertical" | "edit" | "preview"

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

type TranslationKey =
  | "heading1" | "heading2" | "heading3"
  | "bold" | "italic" | "strikethrough"
  | "inlineCode" | "link" | "quote"
  | "bulletList" | "numberedList" | "taskList"
  | "horizontalRule" | "table" | "mermaidDiagram"
  | "splitHorizontal" | "splitVertical" | "editOnly" | "previewOnly"
  | "nothingToPreview"

interface ToolbarButton {
  icon: React.ReactNode
  labelKey: TranslationKey
  action: (
    textareaRef: React.RefObject<HTMLTextAreaElement>,
    value: string,
    onChange: (value: string) => void
  ) => void
}

const insertText = (
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
  before: string,
  after: string = ""
) => {
  const textarea = textareaRef.current
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = value.substring(start, end)

  const newText =
    value.substring(0, start) +
    before +
    selectedText +
    after +
    value.substring(end)

  onChange(newText)

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    )
  }, 0)
}

const insertAtLineStart = (
  textareaRef: React.RefObject<HTMLTextAreaElement>,
  value: string,
  onChange: (value: string) => void,
  prefix: string
) => {
  const textarea = textareaRef.current
  if (!textarea) return

  const start = textarea.selectionStart
  const lineStart = value.lastIndexOf("\n", start - 1) + 1

  const newText =
    value.substring(0, lineStart) + prefix + value.substring(lineStart)

  onChange(newText)

  setTimeout(() => {
    textarea.focus()
    textarea.setSelectionRange(start + prefix.length, start + prefix.length)
  }, 0)
}

const toolbarButtons: ToolbarButton[] = [
  {
    icon: <Heading1 className="h-4 w-4" />,
    labelKey: "heading1",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "# "),
  },
  {
    icon: <Heading2 className="h-4 w-4" />,
    labelKey: "heading2",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "## "),
  },
  {
    icon: <Heading3 className="h-4 w-4" />,
    labelKey: "heading3",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "### "),
  },
  {
    icon: <Bold className="h-4 w-4" />,
    labelKey: "bold",
    action: (ref, value, onChange) => insertText(ref, value, onChange, "**", "**"),
  },
  {
    icon: <Italic className="h-4 w-4" />,
    labelKey: "italic",
    action: (ref, value, onChange) => insertText(ref, value, onChange, "_", "_"),
  },
  {
    icon: <Strikethrough className="h-4 w-4" />,
    labelKey: "strikethrough",
    action: (ref, value, onChange) => insertText(ref, value, onChange, "~~", "~~"),
  },
  {
    icon: <Code className="h-4 w-4" />,
    labelKey: "inlineCode",
    action: (ref, value, onChange) => insertText(ref, value, onChange, "`", "`"),
  },
  {
    icon: <Link className="h-4 w-4" />,
    labelKey: "link",
    action: (ref, value, onChange) => insertText(ref, value, onChange, "[", "](url)"),
  },
  {
    icon: <Quote className="h-4 w-4" />,
    labelKey: "quote",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "> "),
  },
  {
    icon: <List className="h-4 w-4" />,
    labelKey: "bulletList",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "- "),
  },
  {
    icon: <ListOrdered className="h-4 w-4" />,
    labelKey: "numberedList",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "1. "),
  },
  {
    icon: <CheckSquare className="h-4 w-4" />,
    labelKey: "taskList",
    action: (ref, value, onChange) => insertAtLineStart(ref, value, onChange, "- [ ] "),
  },
  {
    icon: <Minus className="h-4 w-4" />,
    labelKey: "horizontalRule",
    action: (ref, value, onChange) => insertText(ref, value, onChange, "\n---\n"),
  },
  {
    icon: <Table className="h-4 w-4" />,
    labelKey: "table",
    action: (ref, value, onChange) =>
      insertText(
        ref,
        value,
        onChange,
        "\n| Header | Header |\n| ------ | ------ |\n| Cell   | Cell   |\n"
      ),
  },
  {
    icon: <GitBranch className="h-4 w-4" />,
    labelKey: "mermaidDiagram",
    action: (ref, value, onChange) =>
      insertText(
        ref,
        value,
        onChange,
        "\n```mermaid\ngraph TD\n    A[Start] --> B[End]\n```\n"
      ),
  },
]

interface ModeButton {
  mode: EditorMode
  icon: React.ReactNode
  labelKey: TranslationKey
}

const modeButtons: ModeButton[] = [
  { mode: "split-horizontal", icon: <Columns2 className="h-4 w-4" />, labelKey: "splitHorizontal" },
  { mode: "split-vertical", icon: <Rows2 className="h-4 w-4" />, labelKey: "splitVertical" },
  { mode: "edit", icon: <PenLine className="h-4 w-4" />, labelKey: "editOnly" },
  { mode: "preview", icon: <Eye className="h-4 w-4" />, labelKey: "previewOnly" },
]

export function RichEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichEditorProps) {
  const { t } = useI18n()
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mode, setMode] = useState<EditorMode>("split-horizontal")

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget

      if (e.key === "Tab") {
        e.preventDefault()
        const start = textarea.selectionStart
        const end = textarea.selectionEnd

        const newValue =
          value.substring(0, start) + "  " + value.substring(end)
        onChange(newValue)

        setTimeout(() => {
          textarea.setSelectionRange(start + 2, start + 2)
        }, 0)
      }

      if (e.key === "Enter") {
        const start = textarea.selectionStart
        const lineStart = value.lastIndexOf("\n", start - 1) + 1
        const line = value.substring(lineStart, start)

        const listMatch = line.match(/^(\s*)([-*]|\d+\.)\s/)
        if (listMatch) {
          e.preventDefault()
          const [, indent, bullet] = listMatch
          const nextBullet = bullet.match(/^\d+$/)
            ? `${parseInt(bullet) + 1}.`
            : bullet
          const newValue =
            value.substring(0, start) +
            "\n" +
            indent +
            nextBullet +
            " " +
            value.substring(start)
          onChange(newValue)

          setTimeout(() => {
            const newPos = start + 1 + indent.length + nextBullet.length + 1
            textarea.setSelectionRange(newPos, newPos)
          }, 0)
        }

        const taskMatch = line.match(/^(\s*)-\s\[[ x]\]\s/)
        if (taskMatch && !listMatch) {
          e.preventDefault()
          const [, indent] = taskMatch
          const newValue =
            value.substring(0, start) +
            "\n" +
            indent +
            "- [ ] " +
            value.substring(start)
          onChange(newValue)

          setTimeout(() => {
            const newPos = start + 1 + indent.length + 6
            textarea.setSelectionRange(newPos, newPos)
          }, 0)
        }
      }

      // Keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "b":
            e.preventDefault()
            insertText(textareaRef, value, onChange, "**", "**")
            break
          case "i":
            e.preventDefault()
            insertText(textareaRef, value, onChange, "_", "_")
            break
          case "k":
            e.preventDefault()
            insertText(textareaRef, value, onChange, "[", "](url)")
            break
        }
      }
    },
    [value, onChange]
  )

  const isSplit = mode === "split-horizontal" || mode === "split-vertical"
  const showEditor = isSplit || mode === "edit"
  const showPreview = isSplit || mode === "preview"

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 rounded-md border bg-muted/50">
        <div className="flex items-center gap-0.5 flex-1 flex-wrap">
          {toolbarButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              title={t(button.labelKey)}
              onClick={() => button.action(textareaRef, value, onChange)}
              disabled={mode === "preview"}
            >
              {button.icon}
            </Button>
          ))}
        </div>

        {/* Mode switcher */}
        <div className="flex items-center border-l pl-2 ml-1">
          {modeButtons.map((btn) => (
            <Button
              key={btn.mode}
              type="button"
              variant={mode === btn.mode ? "secondary" : "ghost"}
              size="icon"
              className="h-7 w-7"
              title={t(btn.labelKey)}
              onClick={() => setMode(btn.mode)}
            >
              {btn.icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Editor / Preview Area */}
      <div className={cn(
        "flex gap-2",
        mode === "split-horizontal" && "flex-row",
        mode === "split-vertical" && "flex-col",
        (mode === "edit" || mode === "preview") && "flex-col"
      )}>
        {showEditor && (
          <div className={cn(
            "flex-1",
            mode === "split-horizontal" && "w-1/2",
            mode === "split-vertical" && "h-1/2"
          )}>
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "resize-none font-mono text-sm",
                mode === "split-vertical" ? "min-h-[150px]" : "min-h-[200px] h-full"
              )}
            />
          </div>
        )}

        {showPreview && (
          <div className={cn(
            "flex-1 p-4 rounded-md border bg-background overflow-auto",
            mode === "split-horizontal" && "w-1/2",
            mode === "split-vertical" && "h-1/2 min-h-[150px]",
            mode === "preview" && "min-h-[200px]"
          )}>
            {value ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted-foreground text-sm italic">{t("nothingToPreview")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
