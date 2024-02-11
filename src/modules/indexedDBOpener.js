export async function openDBAsync() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MyDatabase', 1);

        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('strings')) {
                db.createObjectStore('strings', { keyPath: 'id', autoIncrement: true });
            }
        };

        request.onerror = event => {
            reject(event.target.error);
        };

        request.onsuccess = event => {
            resolve(event.target.result);
        };
    });
};
