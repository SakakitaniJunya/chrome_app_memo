// One-time migration: chrome.storage.sync `memos` array → Firestore.
// Sentinel `colason_users/{uid}/migrationCompletedAt` prevents re-run.

import {
  readMigrationStatus,
  upsertMemo,
  writeMigrationStatus,
  type Memo,
} from "./firestore-memos"

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
    const status = await readMigrationStatus(uid)
    if (status.completed) return
    const localMemos = await readChromeMemos()
    for (const memo of localMemos) {
      await upsertMemo(uid, memo)
    }
    await writeMigrationStatus(uid, localMemos.length)
  })().catch((err) => {
    console.error("[colason] migration failed", err)
    inFlight = null
  })
  return inFlight
}
