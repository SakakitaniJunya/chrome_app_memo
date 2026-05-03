import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { getFirebaseDb } from "./firebase"
import { upsertMemo } from "./firestore-memos"
import type { Memo } from "@/hooks/use-chrome-storage"

const ROOT = "colason_users"

let inFlight: Promise<void> | null = null

export function runMigrationOnce(uid: string, localMemos: Memo[]): Promise<void> {
  if (inFlight) return inFlight
  inFlight = (async () => {
    const db = getFirebaseDb()
    if (!db) return
    const userRef = doc(db, ROOT, uid)
    const snap = await getDoc(userRef)
    if (snap.exists() && snap.data()?.migrationCompletedAt) {
      return
    }
    for (const memo of localMemos) {
      await upsertMemo(uid, memo)
    }
    await setDoc(
      userRef,
      {
        migrationCompletedAt: serverTimestamp(),
        migratedCount: localMemos.length,
      },
      { merge: true },
    )
  })().catch((err) => {
    console.error("[colason] migration failed", err)
    inFlight = null
  })
  return inFlight
}
