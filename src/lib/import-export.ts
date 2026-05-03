import JSZip from "jszip"
import type { Memo } from "@/hooks/use-chrome-storage"

/**
 * Schema version for the JSON export format. Bump when the on-disk shape
 * changes in a non-backwards-compatible way.
 */
export const EXPORT_SCHEMA_VERSION = 1

export interface ExportPayload {
  schema: number
  exportedAt: number
  appName: "Colason"
  memos: Memo[]
}

/**
 * Sanitize a string so it can be used as a filename across OS.
 * Falls back to "untitled" when nothing usable is left.
 */
export function safeFileName(input: string): string {
  const trimmed = (input || "").trim()
  // Strip control chars + chars not allowed on Windows + path separators.
  const cleaned = trimmed
    .replace(/[\u0000-\u001f<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (!cleaned) return "untitled"
  // Cap length so the .md suffix + dedup index still fit in 255 bytes.
  return cleaned.slice(0, 80)
}

/**
 * Serialize a Memo to a Markdown file with YAML-ish frontmatter.
 * tags / category are preserved as frontmatter so round-trips with
 * Obsidian / VSCode keep metadata intact.
 */
export function memoToMarkdown(memo: Memo): string {
  const fm: string[] = ["---"]
  fm.push(`id: ${memo.id}`)
  if (memo.title) fm.push(`title: ${escapeYamlString(memo.title)}`)
  fm.push(`createdAt: ${new Date(memo.createdAt).toISOString()}`)
  fm.push(`updatedAt: ${new Date(memo.updatedAt).toISOString()}`)
  if (memo.tags && memo.tags.length > 0) {
    const list = memo.tags.map((t) => escapeYamlString(t)).join(", ")
    fm.push(`tags: [${list}]`)
  }
  if (memo.category) fm.push(`category: ${escapeYamlString(memo.category)}`)
  fm.push("---")
  fm.push("")
  fm.push(memo.content || "")
  return fm.join("\n")
}

function escapeYamlString(input: string): string {
  // Quote when the value contains characters with YAML meaning.
  if (/[:#\-\[\]\{\},&*?|<>=!%@`"\n']/.test(input)) {
    return `"${input.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
  }
  return input
}

interface ParsedFrontmatter {
  data: Record<string, string | string[]>
  body: string
}

/**
 * Parse the leading `---\n…\n---` YAML-ish block. Only the small subset
 * we emit ourselves is supported (scalar strings + inline arrays).
 */
export function parseFrontmatter(source: string): ParsedFrontmatter {
  const normalized = source.replace(/^\uFEFF/, "")
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(normalized)
  if (!match) {
    return { data: {}, body: normalized }
  }
  const block = match[1] ?? ""
  const body = match[2] ?? ""
  const data: Record<string, string | string[]> = {}
  for (const rawLine of block.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const colon = line.indexOf(":")
    if (colon === -1) continue
    const key = line.slice(0, colon).trim()
    const rawValue = line.slice(colon + 1).trim()
    if (!key) continue
    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      data[key] = rawValue
        .slice(1, -1)
        .split(",")
        .map((s) => unquoteYaml(s.trim()))
        .filter((s) => s.length > 0)
    } else {
      data[key] = unquoteYaml(rawValue)
    }
  }
  return { data, body }
}

function unquoteYaml(input: string): string {
  if (input.length >= 2) {
    const first = input[0]
    const last = input[input.length - 1]
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      return input.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\")
    }
  }
  return input
}

/**
 * Try to coerce a frontmatter date into a unix-ms timestamp.
 * Falls back to "now" so import never throws on weird inputs.
 */
function toTimestamp(value: string | string[] | undefined, fallback: number): number {
  if (typeof value !== "string") return fallback
  const ms = Date.parse(value)
  if (Number.isFinite(ms)) return ms
  const num = Number(value)
  if (Number.isFinite(num) && num > 0) return num
  return fallback
}

/**
 * Convert a parsed Markdown document into a Memo. The fallback title is
 * derived from the first heading or first non-empty line so notes from
 * Obsidian / Notion still arrive with a usable title.
 */
export function markdownToMemo(source: string, fallbackTitle: string): Memo {
  const { data, body } = parseFrontmatter(source)
  const now = Date.now()
  const createdAt = toTimestamp(data["createdAt"] ?? data["created"], now)
  const updatedAt = toTimestamp(
    data["updatedAt"] ?? data["updated"] ?? data["modified"],
    createdAt,
  )

  const id =
    (typeof data["id"] === "string" && data["id"]) || (crypto?.randomUUID?.() ?? `${now}-${Math.random()}`)

  const title =
    (typeof data["title"] === "string" && data["title"]) ||
    extractTitleFromBody(body) ||
    fallbackTitle

  const tagsRaw = data["tags"]
  const tags = Array.isArray(tagsRaw) ? tagsRaw : undefined

  const category = typeof data["category"] === "string" ? data["category"] : undefined

  const memo: Memo = {
    id,
    title: title.trim() || "Untitled",
    content: body.replace(/^\s*\n/, ""),
    createdAt,
    updatedAt,
  }
  if (tags && tags.length > 0) memo.tags = tags
  if (category) memo.category = category
  return memo
}

function extractTitleFromBody(body: string): string | undefined {
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    const heading = /^#{1,6}\s+(.*)$/.exec(line)
    if (heading) return heading[1]
    return line
  }
  return undefined
}

/**
 * Build a JSON blob ready for download.
 */
export function buildJsonExport(memos: Memo[]): Blob {
  const payload: ExportPayload = {
    schema: EXPORT_SCHEMA_VERSION,
    exportedAt: Date.now(),
    appName: "Colason",
    memos,
  }
  return new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
}

/**
 * Build a Markdown zip archive. Each memo gets its own .md file. Filename
 * collisions are handled by suffixing `(2)`, `(3)`, …
 */
export async function buildMarkdownZipExport(memos: Memo[]): Promise<Blob> {
  const zip = new JSZip()
  const used = new Map<string, number>()

  for (const memo of memos) {
    const base = safeFileName(memo.title || "untitled")
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    const filename = count === 0 ? `${base}.md` : `${base} (${count + 1}).md`
    zip.file(filename, memoToMarkdown(memo))
  }

  // Include the JSON export inside the zip too so power users get a
  // full-fidelity backup in a single file.
  zip.file(
    "memos.json",
    JSON.stringify(
      {
        schema: EXPORT_SCHEMA_VERSION,
        exportedAt: Date.now(),
        appName: "Colason",
        memos,
      } satisfies ExportPayload,
      null,
      2,
    ),
  )

  return zip.generateAsync({ type: "blob" })
}

/**
 * Trigger a file download in the browser.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Defer revoke so Chrome has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export interface ImportResult {
  memos: Memo[]
  /** files that could not be parsed (filename + reason) */
  errors: Array<{ filename: string; message: string }>
}

/**
 * Validate that an unknown payload looks like ExportPayload and extract memos.
 */
function memosFromJsonPayload(parsed: unknown, source: string): Memo[] {
  if (Array.isArray(parsed)) {
    return parsed.map((entry, idx) => coerceJsonMemo(entry, `${source}#${idx}`))
  }
  if (parsed && typeof parsed === "object" && "memos" in parsed) {
    const list = (parsed as { memos: unknown }).memos
    if (Array.isArray(list)) {
      return list.map((entry, idx) => coerceJsonMemo(entry, `${source}#${idx}`))
    }
  }
  throw new Error("Unrecognized JSON shape — expected { memos: [] } or an array")
}

function coerceJsonMemo(raw: unknown, where: string): Memo {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Entry at ${where} is not an object`)
  }
  const r = raw as Record<string, unknown>
  const now = Date.now()
  const id =
    typeof r["id"] === "string" && r["id"] ? r["id"] : crypto?.randomUUID?.() ?? `${now}-${Math.random()}`
  const title = typeof r["title"] === "string" ? r["title"] : "Untitled"
  const content = typeof r["content"] === "string" ? r["content"] : ""
  const createdAt = typeof r["createdAt"] === "number" ? r["createdAt"] : now
  const updatedAt = typeof r["updatedAt"] === "number" ? r["updatedAt"] : createdAt

  const memo: Memo = { id, title, content, createdAt, updatedAt }

  if (Array.isArray(r["tags"])) {
    const tags = (r["tags"] as unknown[]).filter((t): t is string => typeof t === "string")
    if (tags.length > 0) memo.tags = tags
  }
  if (typeof r["category"] === "string") {
    memo.category = r["category"]
  }
  return memo
}

/**
 * Import a single user-provided file. Detects type by extension.
 */
export async function importFromFile(file: File): Promise<ImportResult> {
  const name = file.name.toLowerCase()
  if (name.endsWith(".json")) {
    return importJson(await file.text(), file.name)
  }
  if (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt")) {
    return importMarkdownText(await file.text(), file.name)
  }
  if (name.endsWith(".zip")) {
    return importZip(file)
  }
  return {
    memos: [],
    errors: [
      {
        filename: file.name,
        message: "Unsupported file type — expected .json, .md, .markdown, .txt, or .zip",
      },
    ],
  }
}

export function importJson(text: string, filename: string): ImportResult {
  try {
    const parsed = JSON.parse(text) as unknown
    return { memos: memosFromJsonPayload(parsed, filename), errors: [] }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { memos: [], errors: [{ filename, message }] }
  }
}

export function importMarkdownText(text: string, filename: string): ImportResult {
  try {
    const fallback = filename.replace(/\.(md|markdown|txt)$/i, "")
    const memo = markdownToMemo(text, fallback || "Untitled")
    return { memos: [memo], errors: [] }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return { memos: [], errors: [{ filename, message }] }
  }
}

export async function importZip(file: File): Promise<ImportResult> {
  const memos: Memo[] = []
  const errors: ImportResult["errors"] = []
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files)
  for (const entry of entries) {
    if (entry.dir) continue
    const name = entry.name
    const lower = name.toLowerCase()
    try {
      if (lower.endsWith(".json")) {
        const text = await entry.async("string")
        memos.push(...memosFromJsonPayload(JSON.parse(text), name))
        continue
      }
      if (lower.endsWith(".md") || lower.endsWith(".markdown") || lower.endsWith(".txt")) {
        const text = await entry.async("string")
        const fallback = name.split("/").pop()?.replace(/\.(md|markdown|txt)$/i, "") ?? "Untitled"
        memos.push(markdownToMemo(text, fallback))
      }
    } catch (e) {
      errors.push({ filename: name, message: e instanceof Error ? e.message : String(e) })
    }
  }
  return { memos, errors }
}
