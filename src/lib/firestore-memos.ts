// Firestore REST client for the Chrome extension.
//
// We hit the public Firestore REST API directly with the chrome.identity
// access token — no Firebase JS SDK. The Firestore REST surface does NOT
// support realtime listeners, so cross-device updates are reflected via
// polling + visibility-change refresh in the consumer hook.

import {
  getValidAccessToken,
  type GcpUser,
} from "./gcp-auth"

const PROJECT_ID = "yomi-note-app"
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

export interface Memo {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
}

interface FirestoreValue {
  stringValue?: string
  integerValue?: string
  doubleValue?: number
  booleanValue?: boolean
  timestampValue?: string
  nullValue?: null
}

interface FirestoreDocument {
  name: string
  fields?: Record<string, FirestoreValue>
  createTime?: string
  updateTime?: string
}

interface ListDocumentsResponse {
  documents?: FirestoreDocument[]
  nextPageToken?: string
}

function toIso(ms: number): string {
  return new Date(ms).toISOString()
}

function fromTimestamp(value: FirestoreValue | undefined, fallback: number): number {
  if (!value) return fallback
  if (typeof value.timestampValue === "string") {
    const parsed = Date.parse(value.timestampValue)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  if (typeof value.integerValue === "string") {
    const parsed = Number.parseInt(value.integerValue, 10)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function fromString(value: FirestoreValue | undefined): string {
  return typeof value?.stringValue === "string" ? value.stringValue : ""
}

function memoFromDoc(doc: FirestoreDocument): Memo {
  // doc.name = "projects/xxx/databases/(default)/documents/colason_users/{uid}/memos/{memoId}"
  const idFromName = doc.name.split("/").pop() ?? ""
  const fields = doc.fields ?? {}
  const fallback = Date.now()
  return {
    id: idFromName,
    title: fromString(fields["title"]),
    content: fromString(fields["content"]),
    createdAt: fromTimestamp(fields["createdAt"], fallback),
    updatedAt: fromTimestamp(fields["updatedAt"], fallback),
  }
}

function memoToFields(
  memo: Pick<Memo, "title" | "content" | "createdAt" | "updatedAt">,
): Record<string, FirestoreValue> {
  return {
    title: { stringValue: memo.title },
    content: { stringValue: memo.content },
    createdAt: { timestampValue: toIso(memo.createdAt) },
    updatedAt: { timestampValue: toIso(memo.updatedAt) },
  }
}

async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getValidAccessToken()
  if (!token) throw new Error("not_authenticated")
  const headers = new Headers(init.headers)
  headers.set("Authorization", `Bearer ${token}`)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  return fetch(`${BASE}${path}`, { ...init, headers })
}

export async function listMemos(uid: string): Promise<Memo[]> {
  const res = await authedFetch(
    `/colason_users/${encodeURIComponent(uid)}/memos?pageSize=300`,
  )
  if (res.status === 404) return []
  if (!res.ok) {
    throw new Error(`firestore listMemos failed: ${res.status} ${await res.text()}`)
  }
  const json = (await res.json()) as ListDocumentsResponse
  const docs = json.documents ?? []
  return docs.map(memoFromDoc).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function upsertMemo(
  uid: string,
  memo: Pick<Memo, "id" | "title" | "content" | "createdAt"> & {
    updatedAt?: number
  },
): Promise<void> {
  const updatedAt = memo.updatedAt ?? Date.now()
  const body = JSON.stringify({
    fields: memoToFields({
      title: memo.title,
      content: memo.content,
      createdAt: memo.createdAt,
      updatedAt,
    }),
  })
  const res = await authedFetch(
    `/colason_users/${encodeURIComponent(uid)}/memos/${encodeURIComponent(memo.id)}`,
    { method: "PATCH", body },
  )
  if (!res.ok) {
    throw new Error(`firestore upsertMemo failed: ${res.status} ${await res.text()}`)
  }
}

export async function patchMemo(
  uid: string,
  id: string,
  updates: Partial<Pick<Memo, "title" | "content">>,
): Promise<void> {
  const fields: Record<string, FirestoreValue> = {}
  if (typeof updates.title === "string") fields["title"] = { stringValue: updates.title }
  if (typeof updates.content === "string") fields["content"] = { stringValue: updates.content }
  fields["updatedAt"] = { timestampValue: toIso(Date.now()) }

  // Build updateMask query so unspecified fields keep their value.
  const updateMask = Object.keys(fields)
    .map((f) => `updateMask.fieldPaths=${encodeURIComponent(f)}`)
    .join("&")

  const res = await authedFetch(
    `/colason_users/${encodeURIComponent(uid)}/memos/${encodeURIComponent(id)}?${updateMask}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields }),
    },
  )
  if (!res.ok) {
    throw new Error(`firestore patchMemo failed: ${res.status} ${await res.text()}`)
  }
}

export async function removeMemo(uid: string, id: string): Promise<void> {
  const res = await authedFetch(
    `/colason_users/${encodeURIComponent(uid)}/memos/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  )
  if (!res.ok && res.status !== 404) {
    throw new Error(`firestore removeMemo failed: ${res.status} ${await res.text()}`)
  }
}

// Migration completion sentinel doc (top of colason_users/{uid}).
export interface MigrationStatus {
  completed: boolean
  count: number
  completedAt?: number
}

export async function readMigrationStatus(uid: string): Promise<MigrationStatus> {
  const res = await authedFetch(`/colason_users/${encodeURIComponent(uid)}`)
  if (res.status === 404) return { completed: false, count: 0 }
  if (!res.ok) {
    throw new Error(`firestore readMigrationStatus failed: ${res.status}`)
  }
  const json = (await res.json()) as FirestoreDocument
  const fields = json.fields ?? {}
  const completed =
    fields["migrationCompletedAt"] !== undefined &&
    typeof fields["migrationCompletedAt"].timestampValue === "string"
  const count = fromTimestamp(fields["migratedCount"], 0)
  return {
    completed,
    count,
    completedAt: completed
      ? fromTimestamp(fields["migrationCompletedAt"], Date.now())
      : undefined,
  }
}

export async function writeMigrationStatus(
  uid: string,
  count: number,
): Promise<void> {
  const body = JSON.stringify({
    fields: {
      migrationCompletedAt: { timestampValue: toIso(Date.now()) },
      migratedCount: { integerValue: count.toString() },
      migrationSource: { stringValue: "chrome-extension" },
    },
  })
  const res = await authedFetch(
    `/colason_users/${encodeURIComponent(uid)}?` +
      "updateMask.fieldPaths=migrationCompletedAt&" +
      "updateMask.fieldPaths=migratedCount&" +
      "updateMask.fieldPaths=migrationSource",
    { method: "PATCH", body },
  )
  if (!res.ok) {
    throw new Error(`firestore writeMigrationStatus failed: ${res.status}`)
  }
}

export type { GcpUser }
