import { useState, useEffect, useCallback } from "react"

function calculateStorageSize(data: any): number {
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
  createdAt: number
  updatedAt: number
}

export function useMemos() {
  const [memos, setMemos, isLoading] = useChromeStorage<Memo[]>("memos", [])

  const addMemo = useCallback((title: string, content: string) => {
    const newMemo: Memo = {
      id: crypto.randomUUID(),
      title: title || "Untitled",
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    setMemos((prev) => [newMemo, ...prev])
    return newMemo
  }, [setMemos])

  const updateMemo = useCallback((id: string, updates: Partial<Pick<Memo, "title" | "content">>) => {
    setMemos((prev) =>
      prev.map((memo) =>
        memo.id === id
          ? { ...memo, ...updates, updatedAt: Date.now() }
          : memo
      )
    )
  }, [setMemos])

  const deleteMemo = useCallback((id: string) => {
    setMemos((prev) => prev.filter((memo) => memo.id !== id))
  }, [setMemos])

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
      remainingBytes: Math.max(0, maxSize - sizeInBytes)
    }
  }, [memos])

  return { memos, addMemo, updateMemo, deleteMemo, isLoading, getStorageInfo }
}
