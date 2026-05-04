import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"
type AccentColor = "default" | "blue" | "green" | "purple" | "orange" | "rose"
type SizeOption = "small" | "medium" | "large"

const WIDTH_PX: Record<SizeOption, number> = {
  small: 450,
  medium: 600,
  large: 800,
}

const HEIGHT_PX: Record<SizeOption, number> = {
  small: 600,
  medium: 760,
  large: 960,
}

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultAccent?: AccentColor
  defaultWidth?: SizeOption
  defaultHeight?: SizeOption
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  accent: AccentColor
  width: SizeOption
  height: SizeOption
  setTheme: (theme: Theme) => void
  setAccent: (accent: AccentColor) => void
  setWidth: (width: SizeOption) => void
  setHeight: (height: SizeOption) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  accent: "default",
  width: "medium",
  height: "medium",
  setTheme: () => null,
  setAccent: () => null,
  setWidth: () => null,
  setHeight: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

const accentColors: Record<AccentColor, { primary: string; primaryForeground: string }> = {
  default: { primary: "222.2 47.4% 11.2%", primaryForeground: "210 40% 98%" },
  blue: { primary: "221.2 83.2% 53.3%", primaryForeground: "210 40% 98%" },
  green: { primary: "142.1 76.2% 36.3%", primaryForeground: "355.7 100% 97.3%" },
  purple: { primary: "262.1 83.3% 57.8%", primaryForeground: "210 40% 98%" },
  orange: { primary: "24.6 95% 53.1%", primaryForeground: "60 9.1% 97.8%" },
  rose: { primary: "346.8 77.2% 49.8%", primaryForeground: "355.7 100% 97.3%" },
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultAccent = "default",
  defaultWidth = "medium",
  defaultHeight = "medium",
  storageKey = "memo-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)
  const [accent, setAccent] = useState<AccentColor>(defaultAccent)
  const [width, setWidth] = useState<SizeOption>(defaultWidth)
  const [height, setHeight] = useState<SizeOption>(defaultHeight)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Load settings from Chrome storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.get(
        [storageKey, `${storageKey}-accent`, `${storageKey}-width`, `${storageKey}-height`],
        (result) => {
          if (result[storageKey]) {
            setTheme(result[storageKey] as Theme)
          }
          if (result[`${storageKey}-accent`]) {
            setAccent(result[`${storageKey}-accent`] as AccentColor)
          }
          if (result[`${storageKey}-width`]) {
            setWidth(result[`${storageKey}-width`] as SizeOption)
          }
          if (result[`${storageKey}-height`]) {
            setHeight(result[`${storageKey}-height`] as SizeOption)
          }
          setIsLoaded(true)
        }
      )
    } else {
      // Fallback for development
      const storedTheme = localStorage.getItem(storageKey) as Theme
      const storedAccent = localStorage.getItem(`${storageKey}-accent`) as AccentColor
      const storedWidth = localStorage.getItem(`${storageKey}-width`) as SizeOption
      const storedHeight = localStorage.getItem(`${storageKey}-height`) as SizeOption
      if (storedTheme) setTheme(storedTheme)
      if (storedAccent) setAccent(storedAccent)
      if (storedWidth) setWidth(storedWidth)
      if (storedHeight) setHeight(storedHeight)
      setIsLoaded(true)
    }
  }, [storageKey])

  useEffect(() => {
    if (!isLoaded) return

    const root = window.document.documentElement

    // Theme
    root.classList.remove("light", "dark")
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Accent color
    const colors = accentColors[accent]
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--primary-foreground", colors.primaryForeground)

    // Width (CSS class for in-popup layout)
    root.classList.remove("width-small", "width-medium", "width-large")
    root.classList.add(`width-${width}`)

    // Save to storage
    if (typeof chrome !== "undefined" && chrome.storage) {
      chrome.storage.sync.set({
        [storageKey]: theme,
        [`${storageKey}-accent`]: accent,
        [`${storageKey}-width`]: width,
        [`${storageKey}-height`]: height,
      })
    } else {
      localStorage.setItem(storageKey, theme)
      localStorage.setItem(`${storageKey}-accent`, accent)
      localStorage.setItem(`${storageKey}-width`, width)
      localStorage.setItem(`${storageKey}-height`, height)
    }

    // Resize the standalone OS window (PR #13 mode). chrome.runtime.sendMessage
    // is only available in extension context — silently skip for the PWA build.
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage({
          type: "resize",
          width: WIDTH_PX[width],
          height: HEIGHT_PX[height],
        })
      } catch {
        // Service worker may be asleep; resize will apply on next open.
      }
    }
  }, [theme, accent, width, height, isLoaded, storageKey])

  const value = {
    theme,
    accent,
    width,
    height,
    setTheme,
    setAccent,
    setWidth,
    setHeight,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}

export type { Theme, AccentColor, SizeOption }
