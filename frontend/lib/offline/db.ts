/**
 * The device-local database behind VidyaSetu's offline-first learning.
 *
 * IndexedDB, not localStorage: learning events must survive an app restart,
 * a killed tab and a reboot, and must be written from async code without
 * blocking the UI thread. localStorage is synchronous, string-only and gets
 * cleared by "clear site data" sweeps far more readily — it is not a durable
 * queue and this feature does not pretend otherwise.
 *
 * Two stores:
 *   learning_event_queue — events recorded on this device that the server
 *                          has not yet acknowledged. Rows leave only once
 *                          the server names them in a sync response.
 *   offline_cache        — last-known-good copies of read-only content
 *                          (lesson list, lesson slides, progress snapshot)
 *                          so a learner who loses connectivity mid-chapter
 *                          can keep going.
 *
 * Every helper degrades to a no-op when IndexedDB is missing or blocked
 * (private windows, storage disabled). Callers stay on the network path in
 * that case rather than silently substituting a fake local store.
 */

const DB_NAME = "vidyasetu-offline";
const DB_VERSION = 1;

export const QUEUE_STORE = "learning_event_queue";
export const CACHE_STORE = "offline_cache";

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function isOfflineStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase | null> {
  if (!isOfflineStorageAvailable()) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = window.indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: "client_event_id" });
        store.createIndex("student_id", "student_id", { unique: false });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    // A blocked or failed open is not fatal — the app just loses its offline
    // safety net for this session.
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });

  return dbPromise;
}

async function runTransaction<T>(
  storeName: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest | IDBRequest[] | void,
  readResultFrom?: () => T
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    let tx: IDBTransaction;
    try {
      tx = db.transaction(storeName, mode);
    } catch {
      resolve(null);
      return;
    }
    const store = tx.objectStore(storeName);
    let request: IDBRequest | IDBRequest[] | void;
    try {
      request = work(store);
    } catch {
      resolve(null);
      return;
    }
    tx.oncomplete = () => {
      if (readResultFrom) {
        resolve(readResultFrom());
      } else if (request && !Array.isArray(request)) {
        resolve((request as IDBRequest).result as T);
      } else {
        resolve(null);
      }
    };
    tx.onerror = () => resolve(null);
    tx.onabort = () => resolve(null);
  });
}

export async function idbGetAll<T>(storeName: string): Promise<T[]> {
  let request: IDBRequest<T[]> | null = null;
  await runTransaction(storeName, "readonly", (store) => {
    request = store.getAll() as IDBRequest<T[]>;
    return request;
  });
  return (request as IDBRequest<T[]> | null)?.result ?? [];
}

export async function idbPut(storeName: string, value: unknown): Promise<boolean> {
  const db = await openDb();
  if (!db) return false;
  const done = await runTransaction<boolean>(
    storeName,
    "readwrite",
    (store) => store.put(value),
    () => true
  );
  return done === true;
}

export async function idbDelete(storeName: string, key: IDBValidKey): Promise<void> {
  await runTransaction(storeName, "readwrite", (store) => {
    store.delete(key);
  });
}

export async function deleteCache(key: string): Promise<void> {
  await idbDelete(CACHE_STORE, key);
}

export async function idbDeleteMany(
  storeName: string,
  keys: IDBValidKey[]
): Promise<void> {
  if (keys.length === 0) return;
  await runTransaction(storeName, "readwrite", (store) => {
    keys.forEach((key) => store.delete(key));
  });
}

// ── Read-through cache for content the learner may need while offline ────────

interface CacheRecord<T> {
  key: string;
  value: T;
  cached_at: string;
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await idbPut(CACHE_STORE, {
    key,
    value,
    cached_at: new Date().toISOString(),
  } satisfies CacheRecord<T>);
}

export async function readCache<T>(key: string): Promise<T | null> {
  let request: IDBRequest<CacheRecord<T> | undefined> | null = null;
  await runTransaction(CACHE_STORE, "readonly", (store) => {
    request = store.get(key) as IDBRequest<CacheRecord<T> | undefined>;
    return request;
  });
  const record = (request as IDBRequest<CacheRecord<T> | undefined> | null)?.result;
  return record ? record.value : null;
}
