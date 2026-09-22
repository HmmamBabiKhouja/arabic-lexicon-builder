import { runMigrations } from "./migrations/migrationManager.js";

const DB_NAME = "arabic-review-db";
const DB_VERSION = 10;

const STORES = {
    WORDS: "words",
    REVIEWS: "reviews",
    SETTINGS: "settings",
    SYNC_QUEUE: "syncQueue",
    TOMBSTONES: "tombstones",
    CONFLICTS: "conflicts", 
    BATCHES: "batches"
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
            // TOMBSTONES STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.TOMBSTONES
                )
            ) {

                db.createObjectStore(
                    STORES.TOMBSTONES,
                    {
                        keyPath: "id"
                    }
                );

            }

            // =====================================
            // CONFLICTS STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.CONFLICTS
                )
            ) {

                db.createObjectStore(
                    STORES.CONFLICTS,
                    {
                        keyPath: "id"
                    }
                );

            }

            // =====================================
            // BATCHES STORE
            // =====================================

            if (
                !db.objectStoreNames.contains(
                    STORES.BATCHES
                )
            ) {

                const batchStore =
                    db.createObjectStore(
                        STORES.BATCHES,
                        {
                            keyPath: "id"
                        }
                    );

                batchStore.createIndex(
                    "status",
                    "status",
                    {
                        unique: false
                    }
                );

                batchStore.createIndex(
                    "stage",
                    "stage",
                    {
                        unique: false
                    }
                );

                batchStore.createIndex(
                    "reviewerId",
                    "reviewerId",
                    {
                        unique: false
                    }
                );

            }

            // =====================================
            // MIGRATION: VERSION 9
            // =====================================

            if (event.oldVersion < 9) {

                console.log(
                    "Migration 9: adding conflicts store..."
                );

            }

            // =====================================
            // MIGRATION: VERSION 8
            // =====================================

            if (event.oldVersion < 8) {

                console.log(
                    "Migration 8: adding tombstones store..."
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
 * Read word IDs in a streaming/chunked way.
 *
 * Does NOT load all words into memory.
 */
export async function getWordIdsInBatches(
    batchSize = 1000,
    onBatch
) {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORES.WORDS,
            "readonly"
        );

        const store = tx.objectStore(
            STORES.WORDS
        );

        const request = store.openCursor();

        let wordIds = [];

        request.onsuccess = async event => {

            const cursor = event.target.result;

            if (!cursor) {

                if (wordIds.length > 0) {
                    await onBatch(wordIds);
                }

                resolve();
                return;
            }

            wordIds.push(cursor.primaryKey);

            if (wordIds.length >= batchSize) {

                const currentBatch = wordIds;

                wordIds = [];

                try {
                    await onBatch(currentBatch);
                } catch (error) {
                    reject(error);
                    return;
                }
            }

            cursor.continue();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
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
 * Read one word by primary key.
 * Accepts numeric ids stored as numbers even when
 * the caller passes a string.
 */
export async function getWordById(id) {

    const database =
        await openDatabase();


    const keys = [];

    keys.push(id);

    const numericId = Number(id);

    if (
        !Number.isNaN(numericId) &&
        numericId !== id
    ) {

        keys.push(numericId);

    }


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


        const tryKey = (index) => {

            if (index >= keys.length) {

                resolve(null);
                return;

            }


            const request =
                store.get(keys[index]);


            request.onsuccess = () => {

                if (request.result) {

                    resolve(request.result);
                    return;

                }

                tryKey(index + 1);

            };


            request.onerror = () => {

                reject(request.error);

            };

        };


        tryKey(0);

    });

}


/**
 * Find one word by its searchKey.
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
            index.getAll(searchKey);


        request.onsuccess = () => {

            resolve(
                request.result ?? []
            );

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}


/**
 * Find duplicate groups using the searchKey index.
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


                    if (
                        currentKey === null
                    ) {

                        currentKey =
                            key;

                        currentGroup = [
                            word
                        ];

                    }

                    else if (
                        key === currentKey
                    ) {

                        currentGroup.push(
                            word
                        );

                    }

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


            wordStore.put(targetWord);


            if (mergedReview) {

                reviewStore.put(
                    mergedReview
                );

            }


            wordStore.delete(
                sourceWord.id
            );


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
 * Add or update a tombstone record.
 */
export async function saveTombstone(tombstone) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.TOMBSTONES,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.TOMBSTONES
                );


            store.put(tombstone);


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
 * Get all tombstone records.
 */
export async function getTombstones() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.TOMBSTONES,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.TOMBSTONES
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
 * Get one tombstone by id.
 */
export async function getTombstone(id) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

        const tx =
            database.transaction(
                STORES.TOMBSTONES,
                "readonly"
            );


        const store =
            tx.objectStore(
                STORES.TOMBSTONES
            );


        const request =
            store.get(id);


        request.onsuccess = () => {

            resolve(
                request.result ?? null
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}


/**
 * Remove a tombstone record.
 */
export async function deleteTombstone(id) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.TOMBSTONES,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.TOMBSTONES
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


/* ==========================================================
   CONFLICTS
========================================================== */


/**
 * Save or update a conflict record.
 */
export async function saveConflict(conflict) {

    if (
        !conflict ||
        !conflict.id
    ) {

        throw new Error(
            "Cannot save an invalid conflict."
        );

    }


    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.CONFLICTS,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.CONFLICTS
                );


            store.put(
                conflict
            );


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
 * Get one conflict by id.
 */
export async function getConflict(id) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.CONFLICTS,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.CONFLICTS
                );


            const request =
                store.get(id);


            request.onsuccess = () => {

                resolve(
                    request.result ?? null
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
 * Get all conflict records.
 */
export async function getConflicts() {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.CONFLICTS,
                    "readonly"
                );


            const store =
                tx.objectStore(
                    STORES.CONFLICTS
                );


            const request =
                store.getAll();


            request.onsuccess = () => {

                resolve(
                    request.result ?? []
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
 * Delete one conflict.
 */
export async function deleteConflict(id) {

    const database =
        await openDatabase();


    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.CONFLICTS,
                    "readwrite"
                );


            const store =
                tx.objectStore(
                    STORES.CONFLICTS
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

/* ==========================================================
   BATCHES
========================================================== */

/**
 * Save or update one batch.
 */
export async function saveBatch(batch) {

    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.BATCHES,
                    "readwrite"
                );

            const store =
                tx.objectStore(
                    STORES.BATCHES
                );

            store.put(batch);

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
 * Get one batch by ID.
 */
export async function getBatch(
    batchId
) {

    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.BATCHES,
                    "readonly"
                );

            const store =
                tx.objectStore(
                    STORES.BATCHES
                );

            const request =
                store.get(
                    batchId
                );

            request.onsuccess = () => {

                resolve(
                    request.result ??
                    null
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
 * Get all batches.
 */
export async function getBatches() {

    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.BATCHES,
                    "readonly"
                );

            const store =
                tx.objectStore(
                    STORES.BATCHES
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
 * Delete one batch.
 */
export async function deleteBatch(
    batchId
) {

    const database =
        await openDatabase();

    return new Promise(
        (resolve, reject) => {

            const tx =
                database.transaction(
                    STORES.BATCHES,
                    "readwrite"
                );

            const store =
                tx.objectStore(
                    STORES.BATCHES
                );

            store.delete(
                batchId
            );

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