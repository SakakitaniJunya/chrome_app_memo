// Colason extension service worker.
//
// Replaces the old popup-on-toolbar-click flow with a standalone OS window
// (LINE for PC style). Reusing popup.html so the React shell, theme, and
// keyboard shortcuts stay identical.

const POPUP_PAGE = "popup.html"
const WINDOW_WIDTH = 480
const WINDOW_HEIGHT = 720
const STATE_KEY = "colason:windowState"

interface PersistedWindowState {
  windowId: number | null
  left?: number
  top?: number
  width?: number
  height?: number
}

async function readState(): Promise<PersistedWindowState> {
  const stored = await chrome.storage.local.get(STATE_KEY)
  const value = stored[STATE_KEY] as PersistedWindowState | undefined
  return value ?? { windowId: null }
}

async function writeState(state: PersistedWindowState): Promise<void> {
  await chrome.storage.local.set({ [STATE_KEY]: state })
}

async function openOrFocus(): Promise<void> {
  const state = await readState()

  if (state.windowId !== null) {
    try {
      await chrome.windows.update(state.windowId, {
        focused: true,
        drawAttention: true,
      })
      return
    } catch {
      // Window was closed since last write — fall through and create a new one.
    }
  }

  const created = await chrome.windows.create({
    url: chrome.runtime.getURL(POPUP_PAGE),
    type: "popup",
    width: state.width ?? WINDOW_WIDTH,
    height: state.height ?? WINDOW_HEIGHT,
    ...(state.left !== undefined ? { left: state.left } : {}),
    ...(state.top !== undefined ? { top: state.top } : {}),
  })

  if (created?.id !== undefined) {
    await writeState({
      windowId: created.id,
      left: created.left,
      top: created.top,
      width: created.width,
      height: created.height,
    })
  }
}

chrome.action.onClicked.addListener(() => {
  void openOrFocus()
})

chrome.windows.onRemoved.addListener(async (id) => {
  const state = await readState()
  if (state.windowId === id) {
    await writeState({ ...state, windowId: null })
  }
})

chrome.windows.onBoundsChanged?.addListener(async (window) => {
  const state = await readState()
  if (state.windowId !== window.id) return
  await writeState({
    windowId: window.id,
    left: window.left,
    top: window.top,
    width: window.width,
    height: window.height,
  })
})

interface ResizeMessage {
  type: "resize"
  width?: number
  height?: number
}

interface ResizeResponse {
  ok: boolean
  reason?: string
}

function isResizeMessage(value: unknown): value is ResizeMessage {
  if (typeof value !== "object" || value === null) return false
  const candidate = value as Record<string, unknown>
  return candidate.type === "resize"
}

async function applyResize(width?: number, height?: number): Promise<ResizeResponse> {
  const state = await readState()

  if (state.windowId === null) {
    await writeState({
      ...state,
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
    })
    return { ok: true, reason: "persisted-only" }
  }

  try {
    await chrome.windows.update(state.windowId, {
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
    })
    await writeState({
      ...state,
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
    })
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "unknown" }
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isResizeMessage(message)) return false
  void applyResize(message.width, message.height).then(sendResponse)
  return true
})
