import { runMigrations } from "./migrations/migrationManager.js";

const DB_NAME = "arabic-review-db";
const DB_VERSION = 6;

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

            const transaction = event.target.transaction;

            // =========================
            // Create stores
            // =========================

            if (!db.objectStoreNames.contains(STORES.WORDS)) {

                const wordStore = db.createObjectStore(
                    STORES.WORDS,
                    {
                        keyPath: "id"
                    }
                );

                wordStore.createIndex(
                    "currentWord",
                    "currentWord",
                    {
                        unique: false
                    }
                );

                wordStore.createIndex(
                    "originalWord",
                    "originalWord",
                    {
                        unique: false
                    }
                );

                wordStore.createIndex(
                    "searchKey",
                    "searchKey",
                    {
                        unique: false
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

            // =========================
            // Migration: Version 6
            // =========================

            if (event.oldVersion < 6) {

                console.log(
                    "Running Migration 5: adding searchKey..."
                );

                const wordStore =
                    transaction.objectStore(
                        STORES.WORDS
                    );

                const cursorRequest =
                    wordStore.openCursor();

                cursorRequest.onsuccess = event => {

                    const cursor =
                        event.target.result;

                    if (!cursor) {

                        console.log(
                            "Migration 5 complete."
                        );

                        return;

                    }

                    const word = cursor.value;

                    if (!word.searchKey) {

                        word.searchKey =
                            word.currentWord;

                        cursor.update(word);

                    }

                    cursor.continue();

                };

            }

        };

        request.onsuccess = async event => {

            db = event.target.result;

            await runMigrations(db);

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
            STORES.WORDS,
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
            STORES.WORDS,
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

export async function saveReview(review) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORES.REVIEWS,
            "readwrite"
        );

        const store = tx.objectStore(STORES.REVIEWS);

        store.put(review);

        tx.oncomplete = () => resolve();

        tx.onerror = () => reject(tx.error);

    });

}

export async function getReview(wordId) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORES.REVIEWS,
            "readonly"
        );

        const store = tx.objectStore(STORES.REVIEWS);

        const request = store.get(wordId);

        request.onsuccess = () => {

            resolve(request.result);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}

export async function saveSetting(key, value) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORES.SETTINGS,
            "readwrite"
        );

        const store = tx.objectStore(STORES.SETTINGS);

        store.put({
            key,
            value
        });

        tx.oncomplete = () => resolve();

        tx.onerror = () => reject(tx.error);

    });

}

export async function getSetting(key) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORES.SETTINGS,
            "readonly"
        );

        const store = tx.objectStore(STORES.SETTINGS);

        const request = store.get(key);

        request.onsuccess = () => {

            resolve(request.result?.value);

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}

export async function deleteWord(wordId) {

    const database =
        await openDatabase();


    return new Promise((resolve, reject) => {

        const tx =
            database.transaction(
                STORES.WORDS,
                "readwrite"
            );


        const store =
            tx.objectStore(
                STORES.WORDS
            );


        store.delete(wordId);


        tx.oncomplete = () => {

            resolve();

        };


        tx.onerror = () => {

            reject(tx.error);

        };

    });

}

export async function deleteDatabase() {

    if (db) {

        db.close();
        db = null;

    }

    return new Promise((resolve, reject) => {

        const request = indexedDB.deleteDatabase(DB_NAME);

        request.onblocked = () => {

            console.log("Database deletion is BLOCKED.");

        };

        request.onsuccess = () => {

            console.log("Database deleted.");

            resolve();

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}