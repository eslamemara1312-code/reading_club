const DATABASE_NAME = 'reading-club-local-reader';
const DATABASE_VERSION = 1;
const STORE_NAME = 'books';

interface LocalBookRecord {
  id: string;
  ownerId: string;
  groupId: string;
  bookId: string;
  fileBlob: Blob;
  fileName: string;
  mimeType: string;
  lastModified: number;
  currentPage: number;
  totalPages: number | null;
  updatedAt: number;
}

export interface SavedLocalBook {
  id: string;
  ownerId: string;
  groupId: string;
  bookId: string;
  file: File;
  currentPage: number;
  totalPages: number | null;
  updatedAt: number;
}

let databasePromise: Promise<IDBDatabase> | null = null;
const pendingWrites = new Map<string, Promise<unknown>>();

const getOwnerId = () => {
  try {
    const savedUser = JSON.parse(localStorage.getItem('user') ?? 'null') as { id?: string } | null;
    return savedUser?.id ?? 'anonymous';
  } catch {
    return 'anonymous';
  }
};

const makeBookId = (groupId: string, bookId: string) => `${getOwnerId()}:${groupId}:${bookId}`;

const openDatabase = (): Promise<IDBDatabase> => {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Failed to open local reader storage'));
  });

  return databasePromise;
};

const getRecord = async (id: string): Promise<LocalBookRecord | null> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve((request.result as LocalBookRecord | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Failed to read saved local book'));
  });
};

const putRecord = async (record: LocalBookRecord): Promise<void> => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Failed to save local book'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Saving local book was aborted'));
  });
};

const writeSequentially = async <T>(recordId: string, task: () => Promise<T>): Promise<T> => {
  const previous = pendingWrites.get(recordId) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(task);
  pendingWrites.set(recordId, current);
  try {
    return await current;
  } finally {
    if (pendingWrites.get(recordId) === current) pendingWrites.delete(recordId);
  }
};

const toSavedLocalBook = (record: LocalBookRecord): SavedLocalBook => ({
  id: record.id,
  ownerId: record.ownerId,
  groupId: record.groupId,
  bookId: record.bookId,
  file: new File([record.fileBlob], record.fileName, {
    type: record.mimeType || 'application/pdf',
    lastModified: record.lastModified,
  }),
  currentPage: record.currentPage,
  totalPages: record.totalPages,
  updatedAt: record.updatedAt,
});

export const getSavedLocalBook = async (
  groupId: string,
  bookId: string,
): Promise<SavedLocalBook | null> => {
  const record = await getRecord(makeBookId(groupId, bookId));
  return record ? toSavedLocalBook(record) : null;
};

export const saveLocalBookFile = async (
  groupId: string,
  bookId: string,
  file: File,
): Promise<SavedLocalBook> => {
  const record: LocalBookRecord = {
    id: makeBookId(groupId, bookId),
    ownerId: getOwnerId(),
    groupId,
    bookId,
    fileBlob: file,
    fileName: file.name,
    mimeType: file.type || 'application/pdf',
    lastModified: file.lastModified,
    currentPage: 1,
    totalPages: null,
    updatedAt: Date.now(),
  };

  if (navigator.storage?.persist) {
    await navigator.storage.persist().catch(() => false);
  }

  await writeSequentially(record.id, () => putRecord(record));
  return toSavedLocalBook(record);
};

export const updateSavedLocalBookProgress = async (
  groupId: string,
  bookId: string,
  currentPage: number,
  totalPages?: number,
): Promise<void> => {
  const recordId = makeBookId(groupId, bookId);
  await writeSequentially(recordId, async () => {
    const record = await getRecord(recordId);
    if (!record) return;

    await putRecord({
      ...record,
      currentPage: Math.max(1, currentPage),
      totalPages: totalPages && totalPages > 0 ? totalPages : record.totalPages,
      updatedAt: Date.now(),
    });
  });
};
