import { useState, useEffect, useCallback, useRef } from "react"
import { idbGet, idbSet, isIdbAvailable } from "@/lib/idb-store"

function calculateStorageSize(data: any): number {
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

export function useMemos() {
  const [memos, setMemos, isLoading] = useChromeStorage<Memo[]>("memos", [])

  const addMemo = useCallback(
    (title: string, content: string) => {
      const newMemo: Memo = {
        id: crypto.randomUUID(),
        title: title || "Untitled",
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      setMemos((prev) => [newMemo, ...prev])
      return newMemo
    },
    [setMemos]
  )

  const updateMemo = useCallback(
    (id: string, updates: Partial<Pick<Memo, "title" | "content">>) => {
      setMemos((prev) =>
        prev.map((memo) =>
          memo.id === id
            ? { ...memo, ...updates, updatedAt: Date.now() }
            : memo
        )
      )
    },
    [setMemos]
  )

  const deleteMemo = useCallback(
    (id: string) => {
      setMemos((prev) => prev.filter((memo) => memo.id !== id))
    },
    [setMemos]
  )

  const getStorageInfo = useCallback(() => {
    const sizeInBytes = calculateStorageSize(memos)
    // PWA / IndexedDB のときは事実上無制限なので警告を出さない
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
