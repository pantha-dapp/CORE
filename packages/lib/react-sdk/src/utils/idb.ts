export function idb(args: { db: string; store: string }) {
	const { db: DB_NAME, store: STORE_NAME } = args;

	function idbOpen() {
		return new Promise<IDBDatabase>((resolve, reject) => {
			// First probe the current version
			const probe = indexedDB.open(DB_NAME);
			probe.onerror = () => reject(probe.error);
			probe.onsuccess = () => {
				const db = probe.result;
				if (db.objectStoreNames.contains(STORE_NAME)) {
					// Store already exists — use the open connection
					resolve(db);
				} else {
					// Store missing — bump version to trigger onupgradeneeded
					const newVersion = db.version + 1;
					db.close();
					const req = indexedDB.open(DB_NAME, newVersion);
					req.onupgradeneeded = () => {
						if (!req.result.objectStoreNames.contains(STORE_NAME)) {
							req.result.createObjectStore(STORE_NAME);
						}
					};
					req.onsuccess = () => resolve(req.result);
					req.onerror = () => reject(req.error);
				}
			};
			// onupgradeneeded fires on brand-new DB (version 0 → 1)
			probe.onupgradeneeded = () => {
				if (!probe.result.objectStoreNames.contains(STORE_NAME)) {
					probe.result.createObjectStore(STORE_NAME);
				}
			};
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
