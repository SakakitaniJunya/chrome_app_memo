import { useCallback, useEffect, useState } from "react"

/**
 * Cmd/Ctrl+P (and Cmd/Ctrl+K) opens a "quick switcher" / full-text search modal.
 *
 * Returns:
 * - `isOpen`: whether the modal is currently open
 * - `open()`: imperatively open the modal
 * - `close()`: imperatively close the modal
 * - `toggle()`: toggle open state
 *
 * The hook also dispatches and listens for a `colason:open-quick-search`
 * CustomEvent so that other parts of the app (e.g. a button in the chrome)
 * can request the modal without holding a direct reference to this hook.
 */
export function useQuickSwitcher() {
  const [isOpen, setIsOpen] = useState(false)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])

  // Global keyboard shortcut: Cmd/Ctrl + P (and Cmd/Ctrl + K as a fallback,
  // since browsers may intercept Cmd+P for Print).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey
      if (!isCmd) return
      const key = e.key.toLowerCase()
      if (key !== "p" && key !== "k") return

      // Cmd+P is normally the browser's Print shortcut. We hijack it here
      // because the Chrome extension popup and the PWA standalone window
      // do not need print, and users expect Notion / VSCode style behavior.
      e.preventDefault()
      e.stopPropagation()
      setIsOpen((prev) => !prev)
    }
    window.addEventListener("keydown", handler, true)
    return () => window.removeEventListener("keydown", handler, true)
  }, [])

  // External trigger: any code can do
  //   window.dispatchEvent(new CustomEvent("colason:open-quick-search"))
  useEffect(() => {
    const onOpen = () => setIsOpen(true)
    const onClose = () => setIsOpen(false)
    window.addEventListener("colason:open-quick-search", onOpen)
    window.addEventListener("colason:close-quick-search", onClose)
    return () => {
      window.removeEventListener("colason:open-quick-search", onOpen)
      window.removeEventListener("colason:close-quick-search", onClose)
    }
  }, [])

  return { isOpen, open, close, toggle }
}
