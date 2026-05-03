import { useState, useEffect, useCallback, useRef } from "react"
import { idbGet, idbSet, isIdbAvailable } from "@/lib/idb-store"
import { useAuth } from "./use-auth"
import {
  subscribeMemos,
  upsertMemo,
  patchMemo,
  removeMemo,
} from "../lib/firestore-memos"
import { runMigrationOnce } from "../lib/migration"

export interface Memo {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

function calculateStorageSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size
}

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== "undefined" &&
    !!(chrome as unknown as { storage?: { sync?: unknown } }).storage &&
    !!(chrome as unknown as { storage?: { sync?: unknown } }).storage?.sync
  )
}

async function loadLocal<T>(key: string, fallback: T): Promise<T> {
  if (isIdbAvailable()) {
    try {
      const stored = await idbGet<T>(key)
      if (stored !== undefined) return stored
    } catch (err) {
      console.warn("idb load failed, falling back to localStorage", err)
    }
  }
  const ls = localStorage.getItem(key)
  if (ls) {
    try {
      return JSON.parse(ls) as T
    } catch {
      return ls as unknown as T
    }
  }
  return fallback
}

async function saveLocal<T>(key: string, value: T): Promise<void> {
  if (isIdbAvailable()) {
    try {
      await idbSet(key, value)
      return
    } catch (err) {
      console.warn("idb set failed, falling back to localStorage", err)
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // best effort
  }
}

export function useChromeStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void loadLocal<T>(key, defaultValue).then((stored) => {
      if (cancelled) return
      setValue(stored)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = newValue instanceof Function ? newValue(prev) : newValue
        void saveLocal(key, next)
        return next
      })
    },
    [key],
  )

  return [value, setStoredValue, isLoading] as const
}

export function useMemos() {
  const { user, isReady } = useAuth()
  const [localMemos, setLocalMemos] = useState<Memo[]>([])
  const [cloudMemos, setCloudMemos] = useState<Memo[] | null>(null)
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  const [isCloudLoaded, setIsCloudLoaded] = useState(false)
  const localMemosRef = useRef<Memo[]>([])

  useEffect(() => {
    let cancelled = false
    void loadLocal<Memo[]>("memos", []).then((stored) => {
      if (cancelled) return
      setLocalMemos(stored)
      localMemosRef.current = stored
      setIsLocalLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    localMemosRef.current = localMemos
  }, [localMemos])

  useEffect(() => {
    if (!user) {
      setCloudMemos(null)
      setIsCloudLoaded(false)
      return
    }
    if (!isLocalLoaded) return
    void runMigrationOnce(user.uid, localMemosRef.current)
    const unsub = subscribeMemos(user.uid, (memos) => {
      setCloudMemos(memos)
      setIsCloudLoaded(true)
    })
    return () => {
      unsub()
    }
  }, [user, isLocalLoaded])

  const isCloud = user !== null && cloudMemos !== null
  const memos = isCloud ? (cloudMemos as Memo[]) : localMemos
  const isLoading = !isReady || (user ? !isCloudLoaded : !isLocalLoaded)

  const addMemo = useCallback(
    (title: string, content: string) => {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        title: title || "Untitled",
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      if (user) {
        void upsertMemo(user.uid, newMemo)
      } else {
        setLocalMemos((prev) => {
          const next = [newMemo, ...prev]
          void saveLocal("memos", next)
          return next
        })
      }
      return newMemo
    },
    [user],
  )

  const updateMemo = useCallback(
    (id: string, updates: Partial<Pick<Memo, "title" | "content">>) => {
      if (user) {
        void patchMemo(user.uid, id, updates)
      } else {
        setLocalMemos((prev) => {
          const next = prev.map((memo) =>
            memo.id === id
              ? { ...memo, ...updates, updatedAt: Date.now() }
              : memo,
          )
          void saveLocal("memos", next)
          return next
        })
      }
    },
    [user],
  )

  const deleteMemo = useCallback(
    (id: string) => {
      if (user) {
        void removeMemo(user.uid, id)
      } else {
        setLocalMemos((prev) => {
          const next = prev.filter((memo) => memo.id !== id)
          void saveLocal("memos", next)
          return next
        })
      }
    },
    [user],
  )

  const getStorageInfo = useCallback(() => {
    const sizeInBytes = calculateStorageSize(memos)
    const usingChrome = hasChromeStorage()
    const maxSize = usingChrome ? 8192 : Number.POSITIVE_INFINITY
    const usagePercent = usingChrome ? (sizeInBytes / maxSize) * 100 : 0
    const isNearLimit = usingChrome && usagePercent > 80
    const isOverLimit = usingChrome && sizeInBytes > maxSize
    return {
      sizeInBytes,
      maxSize,
      usagePercent: Math.min(usagePercent, 100),
      isNearLimit,
      isOverLimit,
      remainingBytes: usingChrome
        ? Math.max(0, maxSize - sizeInBytes)
        : Number.POSITIVE_INFINITY,
    }
  }, [memos])

  return { memos, addMemo, updateMemo, deleteMemo, isLoading, getStorageInfo }
}
