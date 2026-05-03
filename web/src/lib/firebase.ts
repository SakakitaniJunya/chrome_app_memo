import { initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app"
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
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
          "Set VITE_FIREBASE_* in web/.env to enable sync.",
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

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getFirebaseAuth()
  if (!auth) return null
  const provider = new GoogleAuthProvider()
  const result = await signInWithPopup(auth, provider)
  return result.user
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) return
  await signOut(auth)
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
