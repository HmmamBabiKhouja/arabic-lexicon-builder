import { runMigrations } from "./migrations/migrationManager.js";

const DB_NAME = "arabic-review-db";
const DB_VERSION = 7;

const STORES = {
    WORDS: "words",
    REVIEWS: "reviews",
    SETTINGS: "settings",
    SYNC_QUEUE: "syncQueue"
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

            const transaction =
                event.target.transaction;


            // =====================================
            // WORDS STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.WORDS
                )
            ) {

                const wordStore =
                    db.createObjectStore(
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


            // =====================================
            // REVIEWS STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.REVIEWS
                )
            ) {

                db.createObjectStore(
                    STORES.REVIEWS,
                    {
                        keyPath: "wordId"
                    }
                );

            }


            // =====================================
            // SETTINGS STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.SETTINGS
                )
            ) {

                db.createObjectStore(
                    STORES.SETTINGS,
                    {
                        keyPath: "key"
                    }
                );

            }

            // =====================================
            // SYNC QUEUE STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.SYNC_QUEUE
                )
            ) {

                db.createObjectStore(
                    STORES.SYNC_QUEUE,
                    {
                        keyPath: "id"
                    }
                );

            }


            // =====================================
            // MIGRATION: VERSION 6
            // =====================================

            if (event.oldVersion < 6) {

                console.log(
                    "Running Migration 6: adding searchKey..."
                );


                const wordStore =
                    transaction.objectStore(
                        STORES.WORDS
                    );


                const cursorRequest =
                    wordStore.openCursor();


                cursorRequest.onsuccess =
                    event => {

                        const cursor =
                            event.target.result;


                        if (!cursor) {

                            console.log(
                                "Migration 6 complete."
                            );

                            return;

                        }


                        const word =
                            cursor.value;


                        if (
                            !word.searchKey &&
                            word.currentWord
                        ) {

                            word.searchKey =
                                word.currentWord;


                            cursor.update(word);

                        }


                        cursor.continue();

                    };

            }

        };


        request.onsuccess = async event => {

            db =
                event.target.result;


            await runMigrations(db);


            resolve(db);

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/**
 * Save multiple words
 */
export async function saveWords(words) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.WORDS,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.WORDS
                );


            words.forEach(word => {

                store.put(word);

            });


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(tx.error);

            };

        }
    );

}


/**
 * Get all words
 */
export async function getWords() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.WORDS,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.WORDS
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}


/**
 * Save review
 */
export async function saveReview(review) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.REVIEWS,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.REVIEWS
                );


            store.put(review);


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(tx.error);

            };

        }
    );

}


/**
 * Get review
 */
export async function getReview(wordId) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.REVIEWS,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.REVIEWS
                );


            const request =
                store.get(wordId);


            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}


/**
 * Delete review
 */
export async function deleteReview(wordId) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.REVIEWS,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.REVIEWS
                );


            store.delete(wordId);


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(tx.error);

            };

        }
    );

}


/**
 * Save setting
 */
export async function saveSetting(
    key,
    value
) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.SETTINGS,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.SETTINGS
                );


            store.put({
                key,
                value
            });


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(tx.error);

            };

        }
    );

}


/**
 * Get setting
 */
export async function getSetting(key) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.SETTINGS,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.SETTINGS
                );


            const request =
                store.get(key);


            request.onsuccess = () => {

                resolve(
                    request.result?.value
                );

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}

/**
 * Find one word by its searchKey using the IndexedDB index.
 */
export async function getWordBySearchKey(searchKey) {

    const database =
        await openDatabase();

    return new Promise((resolve, reject) => {

        const tx =
            database.transaction(
                STORES.WORDS,
                "readonly"
            );

        const store =
            tx.objectStore(
                STORES.WORDS
            );

        const index =
            store.index("searchKey");

        const request =
            index.get(searchKey);

        request.onsuccess = () => {

            resolve(
                request.result ?? null
            );

        };

        request.onerror = () => {

            reject(request.error);

        };

    });

}

/**
 * Get all words sharing the same searchKey.
 */
export async function getWordsBySearchKey(searchKey) {

    return await getWordsBySearchKey(searchKey);

}


/**
 * Find duplicate groups using the searchKey index.
 *
 * Returns groups where two or more words
 * share the same searchKey.
 */

export async function getDuplicateGroups() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.WORDS,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.WORDS
                );


            const index =
                store.index(
                    "searchKey"
                );


            const request =
                index.openCursor();


            const duplicates = [];

            let currentKey = null;
            let currentGroup = [];


            const finishGroup = () => {

                if (
                    currentGroup.length > 1
                ) {

                    duplicates.push({

                        searchKey: currentKey,

                        words: currentGroup

                    });

                }

            };


            request.onsuccess =
                event => {

                    const cursor =
                        event.target.result;


                    if (!cursor) {

                        finishGroup();

                        resolve(
                            duplicates
                        );

                        return;

                    }


                    const word =
                        cursor.value;


                    const key =
                        cursor.key;


                    /*
                     * First record
                     */
                    if (
                        currentKey === null
                    ) {

                        currentKey =
                            key;

                        currentGroup = [
                            word
                        ];

                    }

                    /*
                     * Same searchKey
                     */
                    else if (
                        key === currentKey
                    ) {

                        currentGroup.push(
                            word
                        );

                    }

                    /*
                     * New searchKey
                     */
                    else {

                        finishGroup();

                        currentKey =
                            key;

                        currentGroup = [
                            word
                        ];

                    }


                    cursor.continue();

                };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}

/**
 * Delete one word
 */
export async function deleteWord(wordId) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

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

        }
    );

}


/**
 * Atomically merge two word records
 *
 * Saves the target word,
 * optionally transfers the review,
 * deletes the source word,
 * and deletes the source review
 * in one transaction.
 */
export async function mergeWordRecords(
    sourceWord,
    targetWord,
    mergedReview = null
) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    [
                        STORES.WORDS,
                        STORES.REVIEWS
                    ],
                    "readwrite"
                );


            const wordStore =
                tx.objectStore(
                    STORES.WORDS
                );


            const reviewStore =
                tx.objectStore(
                    STORES.REVIEWS
                );


            // Save merged target
            wordStore.put(targetWord);


            // Save transferred review
            if (mergedReview) {

                reviewStore.put(
                    mergedReview
                );

            }


            // Delete source word
            wordStore.delete(
                sourceWord.id
            );


            // Delete source review
            reviewStore.delete(
                sourceWord.id
            );


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(tx.error);

            };


            tx.onabort = () => {

                reject(
                    tx.error ||
                    new Error(
                        "Merge transaction aborted."
                    )
                );

            };

        }
    );

}

/**
 * Add or update an item in the sync queue.
 */
export async function addToSyncQueue(item) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.SYNC_QUEUE,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.SYNC_QUEUE
                );


            store.put(item);


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(
                    tx.error
                );

            };

        }
    );

}


/**
 * Get all pending sync items.
 */
export async function getSyncQueue() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.SYNC_QUEUE,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.SYNC_QUEUE
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                resolve(
                    request.result
                );

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}


/**
 * Remove an item from the sync queue.
 */
export async function removeFromSyncQueue(
    id
) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.SYNC_QUEUE,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.SYNC_QUEUE
                );


            store.delete(id);


            tx.oncomplete = () => {

                resolve();

            };


            tx.onerror = () => {

                reject(
                    tx.error
                );

            };

        }
    );

}


/**
 * Delete the entire database
 */
export async function deleteDatabase() {

    if (db) {

        db.close();

        db = null;

    }


    return new Promise(
        (resolve, reject) => {

            const request =
                indexedDB.deleteDatabase(
                    DB_NAME
                );


            request.onblocked = () => {

                console.warn(
                    "Database deletion is BLOCKED."
                );

            };


            request.onsuccess = () => {

                console.log(
                    "Database deleted."
                );

                resolve();

            };


            request.onerror = () => {

                reject(
                    request.error
                );

            };

        }
    );

}
