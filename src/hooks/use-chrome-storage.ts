import { useState, useEffect, useCallback, useRef } from "react"
import { idbGet, idbSet, isIdbAvailable } from "@/lib/idb-store"
import {
  listMemos,
  upsertMemo,
  patchMemo,
  removeMemo,
} from "@/lib/firestore-memos"
import { runMigrationOnce } from "@/lib/migration"
import { useAuth } from "./use-auth"

function calculateStorageSize(data: unknown): number {
  return new Blob([JSON.stringify(data)]).size
}

function hasChromeStorage(): boolean {
  return typeof chrome !== "undefined" && !!chrome.storage && !!chrome.storage.sync
}

export function useChromeStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const isHydrated = useRef(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (hasChromeStorage()) {
        chrome.storage.sync.get([key], (result) => {
          if (cancelled) return
          if (result[key] !== undefined) {
            setValue(result[key])
          }
          isHydrated.current = true
          setIsLoading(false)
        })
        return
      }

      if (isIdbAvailable()) {
        try {
          const stored = await idbGet<T>(key)
          if (cancelled) return
          if (stored !== undefined) {
            setValue(stored)
          }
        } catch (err) {
          console.warn("idb load failed, falling back to localStorage", err)
          const ls = localStorage.getItem(key)
          if (ls) {
            try {
              setValue(JSON.parse(ls))
            } catch {
              setValue(ls as T)
            }
          }
        }
        isHydrated.current = true
        setIsLoading(false)
        return
      }

      const stored = localStorage.getItem(key)
      if (stored) {
        try {
          setValue(JSON.parse(stored))
        } catch {
          setValue(stored as T)
        }
      }
      isHydrated.current = true
      setIsLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [key])

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prevValue) => {
        const valueToStore =
          newValue instanceof Function ? newValue(prevValue) : newValue

        if (hasChromeStorage()) {
          chrome.storage.sync.set({ [key]: valueToStore })
        } else if (isIdbAvailable()) {
          void idbSet(key, valueToStore).catch((err) => {
            console.warn("idb set failed, falling back to localStorage", err)
            try {
              localStorage.setItem(key, JSON.stringify(valueToStore))
            } catch {
              // best effort
            }
          })
        } else {
          try {
            localStorage.setItem(key, JSON.stringify(valueToStore))
          } catch {
            // best effort
          }
        }

        return valueToStore
      })
    },
    [key]
  )

  return [value, setStoredValue, isLoading] as const
}

export interface Memo {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

function loadLocalMemos(): Promise<Memo[]> {
  return new Promise((resolve) => {
    if (hasChromeStorage()) {
      chrome.storage.sync.get(["memos"], (result) => {
        const value = result["memos"]
        resolve(Array.isArray(value) ? (value as Memo[]) : [])
      })
      return
    }
    if (isIdbAvailable()) {
      idbGet<Memo[]>("memos")
        .then((stored) => resolve(Array.isArray(stored) ? stored : []))
        .catch(() => {
          const ls = localStorage.getItem("memos")
          try {
            resolve(ls ? (JSON.parse(ls) as Memo[]) : [])
          } catch {
            resolve([])
          }
        })
      return
    }
    const ls = localStorage.getItem("memos")
    try {
      resolve(ls ? (JSON.parse(ls) as Memo[]) : [])
    } catch {
      resolve([])
    }
  })
}

function saveLocalMemos(memos: Memo[]): void {
  if (hasChromeStorage()) {
    chrome.storage.sync.set({ memos })
    return
  }
  if (isIdbAvailable()) {
    void idbSet("memos", memos).catch(() => {
      try {
        localStorage.setItem("memos", JSON.stringify(memos))
      } catch {
        // best effort
      }
    })
    return
  }
  try {
    localStorage.setItem("memos", JSON.stringify(memos))
  } catch {
    // best effort
  }
}

const CLOUD_POLL_INTERVAL_MS = 30_000

export function useMemos() {
  const { user, isReady } = useAuth()
  const [localMemos, setLocalMemos] = useState<Memo[]>([])
  const [cloudMemos, setCloudMemos] = useState<Memo[] | null>(null)
  const [isLocalLoaded, setIsLocalLoaded] = useState(false)
  const [isCloudLoaded, setIsCloudLoaded] = useState(false)

  // Load local memos once on mount.
  useEffect(() => {
    let cancelled = false
    void loadLocalMemos().then((stored) => {
      if (cancelled) return
      setLocalMemos(stored)
      setIsLocalLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Sign-in → migrate (once) → poll Firestore.
  useEffect(() => {
    if (!user) {
      setCloudMemos(null)
      setIsCloudLoaded(false)
      return
    }
    if (!isLocalLoaded) return

    let cancelled = false

    const refresh = async () => {
      try {
        const memos = await listMemos(user.sub)
        if (cancelled) return
        setCloudMemos(memos)
        setIsCloudLoaded(true)
      } catch (err) {
        console.error("[colason] listMemos failed", err)
        if (!cancelled) setIsCloudLoaded(true)
      }
    }

    const start = async () => {
      await runMigrationOnce(user.sub)
      if (cancelled) return
      await refresh()
    }
    void start()

    const interval = window.setInterval(() => {
      void refresh()
    }, CLOUD_POLL_INTERVAL_MS)

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh()
      }
    }
    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("focus", refresh)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("focus", refresh)
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
        setCloudMemos((prev) => (prev ? [newMemo, ...prev] : [newMemo]))
        void upsertMemo(user.sub, newMemo).catch((err) =>
          console.error("[colason] upsertMemo failed", err),
        )
      } else {
        setLocalMemos((prev) => {
          const next = [newMemo, ...prev]
          saveLocalMemos(next)
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
        setCloudMemos((prev) =>
          prev
            ? prev.map((memo) =>
                memo.id === id
                  ? { ...memo, ...updates, updatedAt: Date.now() }
                  : memo,
              )
            : prev,
        )
        void patchMemo(user.sub, id, updates).catch((err) =>
          console.error("[colason] patchMemo failed", err),
        )
      } else {
        setLocalMemos((prev) => {
          const next = prev.map((memo) =>
            memo.id === id
              ? { ...memo, ...updates, updatedAt: Date.now() }
              : memo,
          )
          saveLocalMemos(next)
          return next
        })
      }
    },
    [user],
  )

  const deleteMemo = useCallback(
    (id: string) => {
      if (user) {
        setCloudMemos((prev) => (prev ? prev.filter((m) => m.id !== id) : prev))
        void removeMemo(user.sub, id).catch((err) =>
          console.error("[colason] removeMemo failed", err),
        )
      } else {
        setLocalMemos((prev) => {
          const next = prev.filter((memo) => memo.id !== id)
          saveLocalMemos(next)
          return next
        })
      }
    },
    [user],
  )

  const getStorageInfo = useCallback(() => {
    const sizeInBytes = calculateStorageSize(memos)
    // Cloud-backed and IndexedDB-backed storage are effectively unbounded;
    // only chrome.storage.sync (local-only mode) has a meaningful quota.
    const usingChrome = !isCloud && hasChromeStorage()
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
  }, [memos, isCloud])

  return { memos, addMemo, updateMemo, deleteMemo, isLoading, getStorageInfo }
}
