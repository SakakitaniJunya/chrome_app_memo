import { useEffect, useCallback } from "react"

/**
 * Cmd/Ctrl + N triggers a CustomEvent("colason:new-memo").
 * MemoList listens for it (see web build) to open the editor.
 *
 * Returns a `trigger()` callback so UI buttons can invoke the same flow.
 */
export function useNewMemoShortcut() {
  const trigger = useCallback(() => {
    window.dispatchEvent(new CustomEvent("colason:new-memo"))
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (!isCmd) return
      if (e.key.toLowerCase() !== "n") return
      // Avoid hijacking when the user is composing or in a select etc.
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea" || target?.isContentEditable) {
        // still allow shortcut, but do not preventDefault if the user might want to type N
        return
      }
      e.preventDefault()
      trigger()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [trigger])

  return { trigger }
}
