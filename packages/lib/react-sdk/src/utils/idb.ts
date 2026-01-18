export function idb(args: { db: string; store: string }) {
	const { db: DB_NAME, store: STORE_NAME } = args;

	function idbOpen() {
		return new Promise<IDBDatabase>((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, 1);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME);
				}
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async function put<T>(keyName: string, value: T) {
		const db = await idbOpen();
		return new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).put(value, keyName);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async function get<T>(keyName: string) {
		const db = await idbOpen();
		return new Promise<T | undefined>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readonly");
			const req = tx.objectStore(STORE_NAME).get(keyName);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
	}

	async function del(keyName: string) {
		const db = await idbOpen();
		return new Promise<void>((resolve, reject) => {
			const tx = db.transaction(STORE_NAME, "readwrite");
			tx.objectStore(STORE_NAME).delete(keyName);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	const secret = {
		put: (key: string, value: Uint8Array<ArrayBuffer>) =>
			put<Uint8Array<ArrayBuffer>>(key, value),
		get: (key: string) => get<Uint8Array<ArrayBuffer>>(key),
	};

	return { put, get, del, secret };
}
