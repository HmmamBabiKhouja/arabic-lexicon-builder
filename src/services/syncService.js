/* ==========================================================
   Mu'jam - Sync Service
   Two-way synchronization foundation
========================================================== */

import {
    collection,
    doc,
    getDocs,
    setDoc
} from "firebase/firestore";

import {
    addToSyncQueue,
    getSyncQueue,
    removeFromSyncQueue,
    getWords,
    saveWords,
    getReview,
    saveReview
} from "../database/db.js";

import {
    db
} from "./firebaseService.js";


const SYNC_STATUS_KEY = "syncStatus";


/**
 * Sync states:
 *
 * idle      → nothing waiting to sync
 * pending   → local changes waiting to sync
 * syncing   → synchronization in progress
 * error     → synchronization failed
 */

let status = "idle";

const listeners = new Set();


/* ==========================================================
   Sync status
========================================================== */

/**
 * Get current sync status.
 */
export function getSyncStatus() {

    return status;

}


/**
 * Change sync status.
 */
export function setSyncStatus(newStatus) {

    status = newStatus;

    localStorage.setItem(
        SYNC_STATUS_KEY,
        newStatus
    );

    notifyListeners();

}


/**
 * Subscribe to sync status changes.
 *
 * Returns an unsubscribe function.
 */
export function onSyncStatusChange(listener) {

    listeners.add(listener);

    return () => {

        listeners.delete(listener);

    };

}


/**
 * Notify all status listeners.
 */
function notifyListeners() {

    listeners.forEach(listener => {

        try {

            listener(status);

        } catch (error) {

            console.error(
                "Sync status listener error:",
                error
            );

        }

    });

}


/* ==========================================================
   Status helpers
========================================================== */

/**
 * Mark that local data has changed.
 */
export function markSyncPending() {

    setSyncStatus("pending");

}


/**
 * Mark synchronization as started.
 */
export function markSyncing() {

    setSyncStatus("syncing");

}


/**
 * Mark synchronization as successfully completed.
 */
export function markSyncComplete() {

    setSyncStatus("idle");

}


/**
 * Mark synchronization as failed.
 */
export function markSyncError() {

    setSyncStatus("error");

}


/* ==========================================================
   Queue
========================================================== */

/**
 * Add a word to the persistent sync queue.
 */
export async function queueWordSync(word) {

    if (!word || !word.id) {

        throw new Error(
            "Cannot queue an invalid word."
        );

    }


    await addToSyncQueue({

        id: `word:${word.id}`,

        type: "word",

        recordId: String(word.id),

        updatedAt:
            word.updatedAt instanceof Date
                ? word.updatedAt.toISOString()
                : word.updatedAt,

        createdAt:
            new Date().toISOString()

    });


    markSyncPending();

}

/**
 * Add a review to the persistent sync queue.
 */
export async function queueReviewSync(review) {

    if (!review || !review.wordId) {

        throw new Error(
            "Cannot queue an invalid review."
        );

    }


    await addToSyncQueue({

        id: `review:${review.wordId}`,

        type: "review",

        recordId: String(review.wordId),

        updatedAt:
            review.updatedAt instanceof Date
                ? review.updatedAt.toISOString()
                : review.updatedAt,

        createdAt:
            new Date().toISOString()

    });


    markSyncPending();

}


/* ==========================================================
   Firestore upload
========================================================== */

/**
 * Synchronize one word with Firestore.
 *
 * IndexedDB remains the local database.
 * Firestore stores the cloud copy.
 */
export async function syncWord(word) {

    if (!word) {

        throw new Error(
            "Cannot synchronize an empty word."
        );

    }


    if (!word.id) {

        throw new Error(
            "Cannot synchronize a word without an ID."
        );

    }


    try {

        markSyncing();


        const wordRef =
            doc(
                db,
                "words",
                String(word.id)
            );


        await setDoc(
            wordRef,
            {
                ...word,

                updatedAt:
                    word.updatedAt instanceof Date
                        ? word.updatedAt.toISOString()
                        : word.updatedAt,

                createdAt:
                    word.createdAt instanceof Date
                        ? word.createdAt.toISOString()
                        : word.createdAt
            },
            {
                merge: true
            }
        );


        console.log(
            "Word synchronized with Firestore:",
            word.id
        );


        return true;

    } catch (error) {

        console.error(
            "Firestore word sync failed:",
            error
        );


        markSyncError();


        throw error;

    }

}

/**
 * Synchronize one review with Firestore.
 */
export async function syncReview(review) {

    if (!review) {

        throw new Error(
            "Cannot synchronize an empty review."
        );

    }


    if (!review.wordId) {

        throw new Error(
            "Cannot synchronize a review without a wordId."
        );

    }


    try {

        markSyncing();


        const reviewRef =
            doc(
                db,
                "reviews",
                String(review.wordId)
            );


        await setDoc(
            reviewRef,
            {
                ...review,

                updatedAt:
                    review.updatedAt instanceof Date
                        ? review.updatedAt.toISOString()
                        : review.updatedAt
            },
            {
                merge: true
            }
        );


        console.log(
            "Review synchronized with Firestore:",
            review.wordId
        );


        return true;

    } catch (error) {

        console.error(
            "Firestore review sync failed:",
            error
        );


        markSyncError();


        throw error;

    }

}


/* ==========================================================
   Queue processor
========================================================== */

/**
 * Process all pending synchronization items.
 *
 * The latest local word is read from IndexedDB
 * before uploading.
 */
export async function processSyncQueue() {

    const queue =
        await getSyncQueue();


    if (!queue.length) {

        markSyncComplete();

        console.log(
            "SYNC QUEUE: nothing to process."
        );

        return;

    }


    console.log(
        `SYNC QUEUE: processing ${queue.length} item(s).`
    );


    const words =
        await getWords();


    const wordsById =
        new Map(
            words.map(word => [
                String(word.id),
                word
            ])
        );


    let failed = false;


    for (const item of queue) {

        try {

    if (item.type === "word") {

        const word =
            wordsById.get(
                String(item.recordId)
            );


        if (!word) {

            console.warn(
                "SYNC QUEUE: word no longer exists locally:",
                item.recordId
            );


            await removeFromSyncQueue(
                item.id
            );


            continue;

        }


        await syncWord(
            word
        );


        await removeFromSyncQueue(
            item.id
        );


        console.log(
            "SYNC QUEUE: completed:",
            item.id
        );


        continue;

    }


    if (item.type === "review") {

    const review =
        await getReview(
            String(item.recordId)
        );


    if (!review) {

        console.warn(
            "SYNC QUEUE: review no longer exists locally:",
            item.recordId
        );


        await removeFromSyncQueue(
            item.id
        );


        continue;

    }


    await syncReview(
        review
    );


    await removeFromSyncQueue(
        item.id
    );


    console.log(
        "SYNC QUEUE: completed:",
        item.id
    );


    continue;

}


console.warn(
    "SYNC QUEUE: unknown item type:",
    item
);


            const word =
                wordsById.get(
                    String(item.recordId)
                );


            if (!word) {

                console.warn(
                    "SYNC QUEUE: word no longer exists locally:",
                    item.recordId
                );


                await removeFromSyncQueue(
                    item.id
                );


                continue;

            }


            await syncWord(
                word
            );


            await removeFromSyncQueue(
                item.id
            );


            console.log(
                "SYNC QUEUE: completed:",
                item.id
            );


        } catch (error) {

            failed = true;


            console.error(
                "SYNC QUEUE: item failed:",
                item.id,
                error
            );

            /*
             * Keep the queue item so it can
             * be retried later.
             */

        }

    }


    if (failed) {

        markSyncError();

    } else {

        markSyncComplete();

    }

}


/* ==========================================================
   Firestore → IndexedDB
========================================================== */

/**
 * Pull words from Firestore into IndexedDB.
 *
 * Rules:
 *
 * 1. Missing local word
 *    → create locally
 *
 * 2. Firestore newer
 *    → update local copy
 *
 * 3. Local newer or equal
 *    → keep local copy
 */
export async function pullWordsFromFirestore() {

    try {

        markSyncing();


        console.log(
            "SYNC PULL: downloading words from Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "words"
                )
            );


        const localWords =
            await getWords();


        const localById =
            new Map(
                localWords.map(word => [
                    String(word.id),
                    word
                ])
            );


        let imported = 0;
        let updated = 0;
        let skipped = 0;


        for (
            const documentSnapshot
            of snapshot.docs
        ) {

            const remoteWord =
                documentSnapshot.data();


            const remoteId =
                String(
                    remoteWord.id ??
                    documentSnapshot.id
                );


            const localWord =
                localById.get(
                    remoteId
                );


            /* ---------------------------------
               Word does not exist locally
            --------------------------------- */

            if (!localWord) {

                await saveWords([
                    {
                        ...remoteWord,

                        id: remoteId,

                        createdAt:
                            remoteWord.createdAt
                                ? new Date(
                                    remoteWord.createdAt
                                )
                                : new Date(),

                        updatedAt:
                            remoteWord.updatedAt
                                ? new Date(
                                    remoteWord.updatedAt
                                )
                                : new Date()
                    }
                ]);


                imported++;

                continue;

            }


            /* ---------------------------------
               Compare timestamps
            --------------------------------- */

            const localUpdatedAt =
                new Date(
                    localWord.updatedAt
                ).getTime();


            const remoteUpdatedAt =
                new Date(
                    remoteWord.updatedAt
                ).getTime();


            if (
                Number.isNaN(
                    remoteUpdatedAt
                )
            ) {

                console.warn(
                    "SYNC PULL: invalid remote updatedAt:",
                    remoteId
                );


                skipped++;

                continue;

            }


            /* ---------------------------------
               Firestore is newer
            --------------------------------- */

            if (
                remoteUpdatedAt >
                localUpdatedAt
            ) {

                await saveWords([
                    {
                        ...remoteWord,

                        /*
                         * Preserve the exact local
                         * IndexedDB key.
                         */
                        id: localWord.id,

                        createdAt:
                            remoteWord.createdAt
                                ? new Date(
                                    remoteWord.createdAt
                                )
                                : localWord.createdAt,

                        updatedAt:
                            remoteWord.updatedAt
                                ? new Date(
                                    remoteWord.updatedAt
                                )
                                : localWord.updatedAt
                    }
                ]);


                updated++;

                continue;

            }


            /* ---------------------------------
               Local is newer or equal
            --------------------------------- */

            skipped++;

        }


        markSyncComplete();


        console.log(
            "SYNC PULL COMPLETE:",
            {
                imported,
                updated,
                skipped
            }
        );


        return {
            imported,
            updated,
            skipped
        };


    } catch (error) {

        console.error(
            "SYNC PULL FAILED:",
            error
        );


        markSyncError();


        throw error;

    }

}


/* ==========================================================
   Restore saved status
========================================================== */

/**
 * Restore saved status when the app starts.
 */
export function initializeSyncStatus() {

    const savedStatus =
        localStorage.getItem(
            SYNC_STATUS_KEY
        );


    if (
        savedStatus === "pending" ||
        savedStatus === "syncing" ||
        savedStatus === "error"
    ) {

        status = savedStatus;

    } else {

        status = "idle";

    }

}