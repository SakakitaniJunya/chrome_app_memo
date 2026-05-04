import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "ja"

const translations = {
  en: {
    // App
    appName: "Colason",
    memos: "Memos",
    settings: "Settings",

    // Memo List
    newMemo: "New Memo",
    editMemo: "Edit Memo",
    searchMemos: "Search memos...",
    noMemosYet: "No memos yet",
    noMemosFound: "No memos found",
    createFirstMemo: "Create your first memo",
    titleOptional: "Title (optional)",
    writeYourMemo: "Write your memo in Markdown...",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",

    // Editor modes
    splitHorizontal: "Split Horizontal (Left/Right)",
    splitVertical: "Split Vertical (Top/Bottom)",
    editOnly: "Edit Only",
    previewOnly: "Preview Only",
    nothingToPreview: "Nothing to preview",

    // Toolbar labels
    heading1: "Heading 1",
    heading2: "Heading 2",
    heading3: "Heading 3",
    bold: "Bold",
    italic: "Italic",
    strikethrough: "Strikethrough",
    inlineCode: "Inline Code",
    link: "Link",
    quote: "Quote",
    bulletList: "Bullet List",
    numberedList: "Numbered List",
    taskList: "Task List",
    horizontalRule: "Horizontal Rule",
    table: "Table",
    mermaidDiagram: "Mermaid Diagram",

    // Theme Toggle
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    accentColor: "Accent Color",
    popupWidth: "Popup Width",
    reopenToApply: "Reopen the popup to apply width changes",
    windowWidth: "Window Width",
    windowHeight: "Window Height",
    dragToResize: "You can also drag the window edges to resize freely.",

    // Colors
    default: "Default",
    blue: "Blue",
    green: "Green",
    purple: "Purple",
    orange: "Orange",
    rose: "Rose",

    // Settings page
    appearance: "Appearance",
    about: "About",
    aboutDescription: "Colason with Markdown Support",
    features: "Features:",
    featureMarkdown: "Markdown formatting",
    featureMermaid: "Mermaid diagrams",
    featureTables: "Tables support",
    featureTaskLists: "Task lists",
    featureCode: "Code highlighting",
    featureDarkMode: "Dark mode",
    featureAccentColors: "Accent colors",
    keyboardShortcuts: "Keyboard Shortcuts",
    indent: "Indent",

    // Mermaid
    mermaidDocs: "Mermaid Docs",

    // Storage warnings
    storageNearLimit: "Storage limit approaching",
    storageOverLimit: "Storage limit exceeded!",
    storageUsage: "Storage usage",
    deleteOldMemos: "Consider deleting old memos to free up space.",

    // Sync
    sync: "Sync",
    syncDisabled: "Cloud sync is not available",
    syncDisabledHint:
      "chrome.identity is unavailable. Reload the extension or check that the OAuth client_id in manifest.json is wired to a Chrome Extension type credential.",
    syncSignedOut: "Local-only mode",
    syncSignedIn: "Synced to cloud",
    signInWithGoogle: "Sign in with Google",
    signOut: "Sign out",
  },
  ja: {
    // App
    appName: "Colason",
    memos: "メモ",
    settings: "設定",

    // Memo List
    newMemo: "新規メモ",
    editMemo: "メモを編集",
    searchMemos: "メモを検索...",
    noMemosYet: "メモがありません",
    noMemosFound: "メモが見つかりません",
    createFirstMemo: "最初のメモを作成",
    titleOptional: "タイトル（任意）",
    writeYourMemo: "Markdownでメモを書く...",
    save: "保存",
    cancel: "キャンセル",
    loading: "読み込み中...",

    // Editor modes
    splitHorizontal: "横分割（左右）",
    splitVertical: "縦分割（上下）",
    editOnly: "編集のみ",
    previewOnly: "プレビューのみ",
    nothingToPreview: "プレビューする内容がありません",

    // Toolbar labels
    heading1: "見出し1",
    heading2: "見出し2",
    heading3: "見出し3",
    bold: "太字",
    italic: "斜体",
    strikethrough: "取り消し線",
    inlineCode: "インラインコード",
    link: "リンク",
    quote: "引用",
    bulletList: "箇条書き",
    numberedList: "番号付きリスト",
    taskList: "タスクリスト",
    horizontalRule: "水平線",
    table: "テーブル",
    mermaidDiagram: "Mermaid図",

    // Theme Toggle
    theme: "テーマ",
    light: "ライト",
    dark: "ダーク",
    system: "システム",
    accentColor: "アクセントカラー",
    popupWidth: "ポップアップの横幅",
    reopenToApply: "横幅変更はポップアップを開き直すと適用されます",
    windowWidth: "ウィンドウ幅",
    windowHeight: "ウィンドウ高さ",
    dragToResize: "ウィンドウの端をドラッグして自由にサイズ変更もできます。",

    // Colors
    default: "デフォルト",
    blue: "ブルー",
    green: "グリーン",
    purple: "パープル",
    orange: "オレンジ",
    rose: "ローズ",

    // Settings page
    appearance: "外観",
    about: "このアプリについて",
    aboutDescription: "Markdown対応メモアプリ Colason",
    features: "機能:",
    featureMarkdown: "Markdownフォーマット",
    featureMermaid: "Mermaid図",
    featureTables: "テーブル対応",
    featureTaskLists: "タスクリスト",
    featureCode: "コードハイライト",
    featureDarkMode: "ダークモード",
    featureAccentColors: "アクセントカラー",
    keyboardShortcuts: "キーボードショートカット",
    indent: "インデント",

    // Mermaid
    mermaidDocs: "Mermaidドキュメント",

    // Storage warnings
    storageNearLimit: "ストレージ容量が上限に近づいています",
    storageOverLimit: "ストレージ容量が上限を超えました！",
    storageUsage: "使用量",
    deleteOldMemos: "古いメモを削除して容量を確保してください。",

    // Sync
    sync: "同期",
    syncDisabled: "クラウド同期が利用できません",
    syncDisabledHint:
      "chrome.identity が利用できません。拡張を再読み込みするか、manifest.json の OAuth client_id が Chrome Extension タイプの認証情報と紐付いているか確認してください。",
    syncSignedOut: "ローカルのみで動作中",
    syncSignedIn: "クラウドに同期中",
    signInWithGoogle: "Google でログイン",
    signOut: "ログアウト",
  },
}

type TranslationKey = keyof typeof translations.en

interface I18nContextValue {
  lang: Language
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

function detectLanguage(): Language {
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith("ja")) {
    return "ja"
  }
  return "en"
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("en")

  useEffect(() => {
    setLang(detectLanguage())
  }, [])

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key
  }

  return (
    <I18nContext.Provider value={{ lang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

export type { Language, TranslationKey }
