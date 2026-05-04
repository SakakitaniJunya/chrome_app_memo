// GCP-native auth bridge for the Chrome extension.
//
// No Firebase JS SDK, no apiKey, no appId — just chrome.identity OAuth
// tokens used directly against the Firestore REST API.
//
// Trade-off: Firestore Security Rules (request.auth.*) do not apply when
// authorising via Google OAuth tokens. Instead access is gated by GCP IAM:
// the signed-in user must have the "Cloud Datastore User" role (or
// equivalent) on the GCP project. This is fine for owner/internal use.

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/datastore",
] as const

export interface GcpUser {
  sub: string // stable opaque user id (use as Firestore key)
  email?: string
  name?: string
  picture?: string
  accessToken: string
  expiresAt: number // unix ms
}

let cachedUser: GcpUser | null = null
const listeners = new Set<(user: GcpUser | null) => void>()

function emitChange(user: GcpUser | null): void {
  cachedUser = user
  for (const fn of listeners) {
    try {
      fn(user)
    } catch (err) {
      console.error("[colason] auth listener failed", err)
    }
  }
}

function hasChromeIdentity(): boolean {
  return typeof chrome !== "undefined" && !!chrome.identity?.getAuthToken
}

interface AuthTokenOptions {
  interactive: boolean
}

function getAuthTokenAsync(options: AuthTokenOptions): Promise<string | null> {
  return new Promise((resolve) => {
    if (!hasChromeIdentity()) {
      resolve(null)
      return
    }
    // Pass scopes explicitly so chrome.identity does not default to whatever
    // is in manifest.json (which we keep minimal). Chrome 108+ supports the
    // `scopes` field on getAuthToken.
    chrome.identity.getAuthToken(
      { interactive: options.interactive, scopes: [...SCOPES] },
      (token) => {
        const lastError = chrome.runtime.lastError
        if (lastError) {
          console.info("[colason] getAuthToken:", lastError.message)
          resolve(null)
          return
        }
        const value =
          typeof token === "string" && token.length > 0 ? token : null
        resolve(value)
      },
    )
  })
}

function removeCachedAuthToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    if (!hasChromeIdentity() || !chrome.identity?.removeCachedAuthToken) {
      resolve()
      return
    }
    chrome.identity.removeCachedAuthToken({ token }, () => resolve())
  })
}

interface UserInfoResponse {
  sub: string
  email?: string
  name?: string
  picture?: string
}

async function fetchUserInfo(token: string): Promise<UserInfoResponse | null> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return null
  const json = (await res.json()) as Partial<UserInfoResponse>
  if (typeof json.sub !== "string") return null
  return {
    sub: json.sub,
    email: typeof json.email === "string" ? json.email : undefined,
    name: typeof json.name === "string" ? json.name : undefined,
    picture: typeof json.picture === "string" ? json.picture : undefined,
  }
}

// chrome.identity tokens are typically valid 60 minutes. We don't get the
// expiry from the API, so assume 50 minutes to leave a refresh buffer.
const TOKEN_LIFETIME_MS = 50 * 60 * 1000

async function buildGcpUser(token: string): Promise<GcpUser | null> {
  const info = await fetchUserInfo(token)
  if (!info) return null
  return {
    sub: info.sub,
    email: info.email,
    name: info.name,
    picture: info.picture,
    accessToken: token,
    expiresAt: Date.now() + TOKEN_LIFETIME_MS,
  }
}

export async function signInInteractive(): Promise<GcpUser | null> {
  const token = await getAuthTokenAsync({ interactive: true })
  if (!token) return null
  const user = await buildGcpUser(token)
  if (!user) {
    await removeCachedAuthToken(token)
    return null
  }
  emitChange(user)
  return user
}

export async function silentSignIn(): Promise<GcpUser | null> {
  const token = await getAuthTokenAsync({ interactive: false })
  if (!token) {
    if (cachedUser !== null) emitChange(null)
    return null
  }
  const user = await buildGcpUser(token)
  if (!user) {
    await removeCachedAuthToken(token)
    if (cachedUser !== null) emitChange(null)
    return null
  }
  emitChange(user)
  return user
}

export async function signOut(): Promise<void> {
  if (cachedUser?.accessToken) {
    await removeCachedAuthToken(cachedUser.accessToken)
  } else {
    const token = await getAuthTokenAsync({ interactive: false })
    if (token) await removeCachedAuthToken(token)
  }
  emitChange(null)
}

export function getCurrentUser(): GcpUser | null {
  return cachedUser
}

export async function getValidAccessToken(): Promise<string | null> {
  if (cachedUser && cachedUser.expiresAt > Date.now()) {
    return cachedUser.accessToken
  }
  // Refresh silently; chrome.identity caches the token so this is cheap.
  const refreshed = await silentSignIn()
  return refreshed?.accessToken ?? null
}

export function onAuthChanged(
  cb: (user: GcpUser | null) => void,
): () => void {
  listeners.add(cb)
  // Fire immediately with current state for parity with onAuthStateChanged.
  cb(cachedUser)
  return () => {
    listeners.delete(cb)
  }
}

export function isGcpAuthSupported(): boolean {
  return hasChromeIdentity()
}
