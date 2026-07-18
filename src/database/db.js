const DB_NAME = "arabic-review-db";
const DB_VERSION = 2;
const STORES = {
    WORDS: "words",
    REVIEWS: "reviews",
    SETTINGS: "settings"
};

let db = null;

/**
 * Open IndexedDB
 */
export async function openDatabase() {

    return new Promise((resolve, reject) => {

        const request = indexedDB.open(
            DB_NAME,
            DB_VERSION
        );

        request.onupgradeneeded = event => {

            db = event.target.result;

            if (!db.objectStoreNames.contains(STORES.WORDS)) {

                db.createObjectStore(
                    STORES.WORDS,
                    {
                        keyPath: "id"
                    }
                );

            }

            if (!db.objectStoreNames.contains(STORES.REVIEWS)) {

                db.createObjectStore(
                    STORES.REVIEWS,
                    {
                        keyPath: "wordId"
                    }
                );

            }

            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {

                db.createObjectStore(
                    STORES.SETTINGS,
                    {
                        keyPath: "key"
                    }
                );

            }

        };

        request.onsuccess = event => {

            db = event.target.result;

            resolve(db);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}

export async function saveWords(words) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORE_NAME,
            "readwrite"
        );

        const store = tx.objectStore(STORES.WORDS);

        words.forEach(word => {

            store.put(word);

        });

        tx.oncomplete = () => resolve();

        tx.onerror = () => reject(tx.error);

    });

}

export async function getWords() {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = tx.objectStore(STORES.WORDS); 
        const request = store.getAll();

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}