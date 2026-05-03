import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  type DocumentData,
} from "firebase/firestore"
import { getFirebaseDb } from "./firebase"
import type { Memo } from "@/hooks/use-chrome-storage"

const ROOT = "colason_users"
const SUB = "memos"

function memosCol(uid: string) {
  const db = getFirebaseDb()
  if (!db) return null
  return collection(db, ROOT, uid, SUB)
}

function memoDoc(uid: string, id: string) {
  const db = getFirebaseDb()
  if (!db) return null
  return doc(db, ROOT, uid, SUB, id)
}

function toMillis(value: unknown, fallback: number): number {
  if (value instanceof Timestamp) return value.toMillis()
  if (typeof value === "number") return value
  return fallback
}

function fromDoc(data: DocumentData, id: string): Memo {
  const fallback = Date.now()
  return {
    id,
    title: typeof data.title === "string" ? data.title : "",
    content: typeof data.content === "string" ? data.content : "",
    createdAt: toMillis(data.createdAt, fallback),
    updatedAt: toMillis(data.updatedAt, fallback),
  }
}

export function subscribeMemos(
  uid: string,
  cb: (memos: Memo[]) => void,
): () => void {
  const col = memosCol(uid)
  if (!col) {
    cb([])
    return () => {}
  }
  const q = query(col, orderBy("updatedAt", "desc"))
  return onSnapshot(
    q,
    (snap) => {
      const memos = snap.docs.map((d) => fromDoc(d.data(), d.id))
      cb(memos)
    },
    (err) => {
      console.error("[colason] memo subscription error", err)
    },
  )
}

export async function upsertMemo(
  uid: string,
  memo: Pick<Memo, "id" | "title" | "content" | "createdAt"> & {
    updatedAt?: number
  },
): Promise<void> {
  const ref = memoDoc(uid, memo.id)
  if (!ref) return
  await setDoc(
    ref,
    {
      title: memo.title,
      content: memo.content,
      createdAt: memo.createdAt,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function patchMemo(
  uid: string,
  id: string,
  updates: Partial<Pick<Memo, "title" | "content">>,
): Promise<void> {
  const ref = memoDoc(uid, id)
  if (!ref) return
  await setDoc(
    ref,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function removeMemo(uid: string, id: string): Promise<void> {
  const ref = memoDoc(uid, id)
  if (!ref) return
  await deleteDoc(ref)
}
