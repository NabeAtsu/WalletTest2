import { openDBAsync } from "../modules/indexedDBOpener.js"

export async function saveRandomStringAsync(randomString) {
    const db = await openDBAsync();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['strings'], 'readwrite');
        const store = transaction.objectStore('strings');
        const request = store.add({ value: randomString });

        request.onerror = event => {
            reject(event.target.error);
        };

        request.onsuccess = event => {
            resolve(event.target.result);
        };
    });
};

export async function getRandomStringAsync() {
    const db = await openDBAsync();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(['strings'], 'readonly');
        const store = transaction.objectStore('strings');
        const request = store.openCursor(null, 'prev');

        request.onerror = event => {
            reject(event.target.error);
        };

        request.onsuccess = event => {
            const cursor = event.target.result;
            if (cursor) {
                resolve(cursor.value.value);
            } else {
                resolve(null);
            }
        };
    });
};

