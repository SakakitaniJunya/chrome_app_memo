// One-time migration: extension's chrome.storage.sync `memos` array
// → Firestore `colason_users/{uid}/memos/{memoId}`.
//
// Runs automatically when the user first signs in. Marks completion in
// `colason_users/{uid}` so it never re-runs (even across devices).

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { getFirebaseDb } from "./firebase"
import { upsertMemo } from "./firestore-memos"
import type { Memo } from "@/hooks/use-chrome-storage"

const ROOT = "colason_users"

let inFlight: Promise<void> | null = null

function readChromeMemos(): Promise<Memo[]> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.storage?.sync?.get) {
      resolve([])
      return
    }
    chrome.storage.sync.get(["memos"], (result) => {
      const value = result["memos"]
      if (Array.isArray(value)) {
        resolve(value as Memo[])
      } else {
        resolve([])
      }
    })
  })
}

export function runMigrationOnce(uid: string): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    const db = getFirebaseDb()
    if (!db) return
    const userRef = doc(db, ROOT, uid)
    const snap = await getDoc(userRef)
    if (snap.exists() && snap.data()?.migrationCompletedAt) {
      return
    }
    const localMemos = await readChromeMemos()
    for (const memo of localMemos) {
      await upsertMemo(uid, memo)
    }
    await setDoc(
      userRef,
      {
        migrationCompletedAt: serverTimestamp(),
        migratedCount: localMemos.length,
        migrationSource: "chrome-extension",
      },
      { merge: true },
    )
  })().catch((err) => {
    console.error("[colason] migration failed", err)
    inFlight = null
  })
  return inFlight
}
