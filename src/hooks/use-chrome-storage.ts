import { useState, useEffect, useCallback, useMemo } from "react"

function calculateStorageSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size
}

export function useChromeStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get([key], (result) => {
        if (result[key] !== undefined) {
          setValue(result[key])
        }
        setIsLoading(false)
      })
    } else {
      // Fallback for development
      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          setValue(JSON.parse(stored))
        } catch {
          setValue(stored as T)
        }
      }
      setIsLoading(false)
    }
  }, [key])

  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prevValue) => {
      const valueToStore = newValue instanceof Function ? newValue(prevValue) : newValue

      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.sync.set({ [key]: valueToStore })
      } else {
        localStorage.setItem(key, JSON.stringify(valueToStore))
      }

      return valueToStore
    })
  }, [key])

  return [value, setStoredValue, isLoading] as const
}

export interface Memo {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

// Pre-tag schema that may exist in storage from older versions.
type LegacyMemo = Omit<Memo, "tags"> & { tags?: string[] }

/**
 * Normalize a memo loaded from storage so it always has a `tags` array.
 * Older versions of the app stored memos without the `tags` field.
 */
function normalizeMemo(raw: LegacyMemo): Memo {
  return {
    ...raw,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  }
}

/**
 * Normalize a tag string. Tags are case-insensitive, trimmed, and limited
 * to a reasonable length. Returns null if the input is invalid.
 */
export function normalizeTag(input: string): string | null {
  const trimmed = input.trim().replace(/\s+/g, " ")
  if (!trimmed) return null
  // Strip leading "#" if user typed it.
  const stripped = trimmed.startsWith("#") ? trimmed.slice(1).trim() : trimmed
  if (!stripped) return null
  return stripped.slice(0, 32)
}

/**
 * Tag equality is case-insensitive. Use this as the canonical key
 * for grouping / lookup, but preserve the original casing for display.
 */
export function tagKey(tag: string): string {
  return tag.toLowerCase()
}

export function useMemos() {
  const [rawMemos, setMemos, isLoading] = useChromeStorage<LegacyMemo[]>("memos", [])

  // Always expose normalized memos to the rest of the app.
  const memos = useMemo<Memo[]>(() => rawMemos.map(normalizeMemo), [rawMemos])

  const addMemo = useCallback(
    (title: string, content: string, tags: string[] = []) => {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        title: title || "Untitled",
        content,
        tags: dedupeTags(tags),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setMemos((prev) => [newMemo, ...prev.map(normalizeMemo)])
      return newMemo
    },
    [setMemos]
  )

  const updateMemo = useCallback(
    (
      id: string,
      updates: Partial<Pick<Memo, "title" | "content" | "tags">>
    ) => {
      setMemos((prev) =>
        prev.map(normalizeMemo).map((memo) =>
          memo.id === id
            ? {
                ...memo,
                ...updates,
                tags:
                  updates.tags !== undefined
                    ? dedupeTags(updates.tags)
                    : memo.tags,
                updatedAt: Date.now(),
              }
            : memo
        )
      )
    },
    [setMemos]
  )

  const deleteMemo = useCallback(
    (id: string) => {
      setMemos((prev) => prev.map(normalizeMemo).filter((memo) => memo.id !== id))
    },
    [setMemos]
  )

  /**
   * Rename a tag globally. Case-insensitive match against the source tag.
   * If the new tag already exists on a memo, it is deduplicated.
   */
  const renameTag = useCallback(
    (from: string, to: string) => {
      const target = normalizeTag(to)
      if (!target) return
      const fromKey = tagKey(from)
      setMemos((prev) =>
        prev.map(normalizeMemo).map((memo) => {
          if (!memo.tags.some((tag) => tagKey(tag) === fromKey)) return memo
          const replaced = memo.tags.map((tag) =>
            tagKey(tag) === fromKey ? target : tag
          )
          return { ...memo, tags: dedupeTags(replaced), updatedAt: Date.now() }
        })
      )
    },
    [setMemos]
  )

  /**
   * Merge `sources` tags into `target`. All memos carrying any of the source
   * tags will end up with `target` instead.
   */
  const mergeTags = useCallback(
    (sources: string[], target: string) => {
      const targetTag = normalizeTag(target)
      if (!targetTag) return
      const sourceKeys = new Set(sources.map(tagKey))
      sourceKeys.delete(tagKey(targetTag))
      if (sourceKeys.size === 0) return
      setMemos((prev) =>
        prev.map(normalizeMemo).map((memo) => {
          const hasSource = memo.tags.some((tag) => sourceKeys.has(tagKey(tag)))
          if (!hasSource) return memo
          const next = memo.tags.map((tag) =>
            sourceKeys.has(tagKey(tag)) ? targetTag : tag
          )
          return { ...memo, tags: dedupeTags(next), updatedAt: Date.now() }
        })
      )
    },
    [setMemos]
  )

  /**
   * Delete a tag from every memo without touching the memos themselves.
   */
  const deleteTag = useCallback(
    (tag: string) => {
      const key = tagKey(tag)
      setMemos((prev) =>
        prev.map(normalizeMemo).map((memo) => {
          if (!memo.tags.some((t) => tagKey(t) === key)) return memo
          return {
            ...memo,
            tags: memo.tags.filter((t) => tagKey(t) !== key),
            updatedAt: Date.now(),
          }
        })
      )
    },
    [setMemos]
  )

  const getStorageInfo = useCallback(() => {
    const sizeInBytes = calculateStorageSize(memos)
    const maxSize = 8192 // 8KB limit for chrome.storage.sync per key
    const usagePercent = (sizeInBytes / maxSize) * 100
    const isNearLimit = usagePercent > 80
    const isOverLimit = sizeInBytes > maxSize

    return {
      sizeInBytes,
      maxSize,
      usagePercent: Math.min(usagePercent, 100),
      isNearLimit,
      isOverLimit,
      remainingBytes: Math.max(0, maxSize - sizeInBytes),
    }
  }, [memos])

  return {
    memos,
    addMemo,
    updateMemo,
    deleteMemo,
    renameTag,
    mergeTags,
    deleteTag,
    isLoading,
    getStorageInfo,
  }
}

/**
 * Deduplicate tags case-insensitively while preserving the first-seen casing
 * and discarding empty values.
 */
function dedupeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of tags) {
    const normalized = normalizeTag(raw)
    if (!normalized) continue
    const key = tagKey(normalized)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
  }
  return out
}

export interface TagSummary {
  /** Display-cased tag (the first occurrence wins). */
  tag: string
  /** Lowercase canonical key used for lookup. */
  key: string
  /** Number of memos tagged with this. */
  count: number
}

/**
 * Aggregate tag usage across a set of memos. Sorted by count desc, then name asc.
 */
export function summarizeTags(memos: Memo[]): TagSummary[] {
  const map = new Map<string, TagSummary>()
  for (const memo of memos) {
    for (const tag of memo.tags) {
      const key = tagKey(tag)
      const existing = map.get(key)
      if (existing) {
        existing.count += 1
      } else {
        map.set(key, { tag, key, count: 1 })
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count
    return a.tag.localeCompare(b.tag)
  })
}
