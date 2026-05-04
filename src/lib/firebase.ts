// Firebase bridge for the Chrome extension build.
//
// Strategy:
//   - Use chrome.identity.getAuthToken to obtain a Google OAuth2 access token
//     for the user already signed into Chrome. No popup, no redirect — just
//     a single native consent dialog on first use.
//   - Convert the access token into a Firebase credential via
//     GoogleAuthProvider.credential(null, accessToken) and signInWithCredential.
//   - Auth persistence is in-memory only (chrome.storage backed persistence
//     is not exposed by Firebase Auth web SDK), so we re-auth silently on
//     every popup window load using a non-interactive getAuthToken call.

import {
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  setPersistence,
  inMemoryPersistence,
  type Auth,
  type User,
} from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore"

interface FirebaseEnv {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
}

function readEnv(): FirebaseEnv | null {
  const env = import.meta.env as Record<string, string | undefined>
  const apiKey = env.VITE_FIREBASE_API_KEY
  const authDomain = env.VITE_FIREBASE_AUTH_DOMAIN
  const projectId = env.VITE_FIREBASE_PROJECT_ID
  const appId = env.VITE_FIREBASE_APP_ID
  if (!apiKey || !authDomain || !projectId || !appId) return null
  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  }
}

let cachedApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null
let cachedDb: Firestore | null = null
let configMissingWarned = false

function getApp(): FirebaseApp | null {
  if (cachedApp) return cachedApp
  const cfg = readEnv()
  if (!cfg) {
    if (!configMissingWarned) {
      console.info(
        "[colason] Firebase config missing — running in local-only mode. " +
          "Set VITE_FIREBASE_* in .env (root) to enable cloud sync.",
      )
      configMissingWarned = true
    }
    return null
  }
  const options: FirebaseOptions = {
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    appId: cfg.appId,
    ...(cfg.storageBucket ? { storageBucket: cfg.storageBucket } : {}),
    ...(cfg.messagingSenderId ? { messagingSenderId: cfg.messagingSenderId } : {}),
  }
  cachedApp = initializeApp(options)
  return cachedApp
}

export function isFirebaseConfigured(): boolean {
  return readEnv() !== null
}

export function getFirebaseAuth(): Auth | null {
  if (cachedAuth) return cachedAuth
  const app = getApp()
  if (!app) return null
  cachedAuth = getAuth(app)
  // Extension popups can be torn down between sessions; chrome.identity holds
  // the long-lived token so we don't need IndexedDB-backed persistence.
  void setPersistence(cachedAuth, inMemoryPersistence).catch((err) => {
    console.warn("[colason] setPersistence failed", err)
  })
  return cachedAuth
}

export function getFirebaseDb(): Firestore | null {
  if (cachedDb) return cachedDb
  const app = getApp()
  if (!app) return null
  cachedDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  })
  return cachedDb
}

function hasChromeIdentity(): boolean {
  return (
    typeof chrome !== "undefined" && !!chrome.identity?.getAuthToken
  )
}

interface AuthTokenOptions {
  interactive: boolean
}

function getAuthTokenAsync(
  options: AuthTokenOptions,
): Promise<string | null> {
  return new Promise((resolve) => {
    if (!hasChromeIdentity()) {
      resolve(null)
      return
    }
    chrome.identity.getAuthToken(options, (token) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        console.info("[colason] chrome.identity.getAuthToken:", lastError.message)
        resolve(null)
        return
      }
      // Chrome 88+: token is a string; older versions returned undefined.
      const value =
        typeof token === "string" && token.length > 0 ? token : null
      resolve(value)
    })
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

async function exchangeForFirebaseUser(token: string): Promise<User | null> {
  const auth = getFirebaseAuth()
  if (!auth) return null
  const credential = GoogleAuthProvider.credential(null, token)
  const result = await signInWithCredential(auth, credential)
  return result.user
}

export async function signInWithChromeIdentity(): Promise<User | null> {
  const token = await getAuthTokenAsync({ interactive: true })
  if (!token) return null
  try {
    return await exchangeForFirebaseUser(token)
  } catch (err) {
    // Token may be stale — drop the cache and retry once.
    console.warn("[colason] signInWithCredential failed, clearing cache", err)
    await removeCachedAuthToken(token)
    const fresh = await getAuthTokenAsync({ interactive: true })
    if (!fresh) return null
    return await exchangeForFirebaseUser(fresh)
  }
}

export async function silentSignInWithChromeIdentity(): Promise<User | null> {
  const token = await getAuthTokenAsync({ interactive: false })
  if (!token) return null
  try {
    return await exchangeForFirebaseUser(token)
  } catch (err) {
    console.warn("[colason] silent signInWithCredential failed", err)
    await removeCachedAuthToken(token)
    return null
  }
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth()
  if (auth) {
    try {
      await signOut(auth)
    } catch (err) {
      console.warn("[colason] signOut failed", err)
    }
  }
  // Also drop chrome.identity's cached token so the next sign-in is clean.
  const token = await getAuthTokenAsync({ interactive: false })
  if (token) {
    await removeCachedAuthToken(token)
  }
}

export function onAuthChanged(cb: (user: User | null) => void): () => void {
  const auth = getFirebaseAuth()
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => cb(user))
}

export type { User }
