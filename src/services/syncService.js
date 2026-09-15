/* ==========================================================
   Mu'jam - Sync Service
   Two-way synchronization foundation
========================================================== */

import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc
} from "firebase/firestore";

import {
    addToSyncQueue,
    getSyncQueue,
    removeFromSyncQueue,
    getWords,
    saveWords,
    getReview,
    saveReview,
    deleteWord,
    deleteReview,
    saveTombstone,
    getTombstones,
    saveConflict
} from "../database/db.js";

import {
    db
} from "./firebaseService.js";


const SYNC_STATUS_KEY = "syncStatus";

let status = "idle";

const listeners = new Set();


/* ==========================================================
   SYNC STATUS
========================================================== */

export function getSyncStatus() {

    return status;

}


export function setSyncStatus(
    newStatus
) {

    status =
        newStatus;

    localStorage.setItem(
        SYNC_STATUS_KEY,
        newStatus
    );

    notifyListeners();

}


export function onSyncStatusChange(
    listener
) {

    listeners.add(
        listener
    );

    return () => {

        listeners.delete(
            listener
        );

    };

}


function notifyListeners() {

    listeners.forEach(
        listener => {

            try {

                listener(
                    status
                );

            } catch (error) {

                console.error(
                    "Sync status listener error:",
                    error
                );

            }

        }
    );

}


export function markSyncPending() {

    setSyncStatus(
        "pending"
    );

}


export function markSyncing() {

    setSyncStatus(
        "syncing"
    );

}


export function markSyncComplete() {

    setSyncStatus(
        "idle"
    );

}


export function markSyncError() {

    setSyncStatus(
        "error"
    );

}


/* ==========================================================
   WORD SYNC QUEUE
========================================================== */

export async function queueWordSync(
    word
) {

    if (
        !word ||
        !word.id
    ) {

        throw new Error(
            "Cannot queue an invalid word."
        );

    }


    await addToSyncQueue({

        id:
            `word:${word.id}`,

        type:
            "word",

        recordId:
            String(
                word.id
            ),

        updatedAt:
            word.updatedAt instanceof Date
                ? word.updatedAt.toISOString()
                : word.updatedAt,

        createdAt:
            new Date().toISOString()

    });


    markSyncPending();

}


/* ==========================================================
   WORD CLOUD SYNC
========================================================== */

/* ==========================================================
   WORD CLOUD SYNC
========================================================== */

export async function syncWord(
    word
) {

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


        const wordId =
            String(
                word.id
            );


        const wordRef =
            doc(
                db,
                "words",
                wordId
            );


        /* ==================================================
           READ CURRENT FIRESTORE VERSION FIRST
        ================================================== */

        const remoteSnapshot =
            await getDoc(
                wordRef
            );


        if (
            remoteSnapshot.exists()
        ) {

            const remoteWord =
                remoteSnapshot.data();


            const remoteUpdatedDate =
                parseSyncTimestamp(
                    remoteWord.updatedAt
                );


            /*
             * If Firestore contains an invalid timestamp,
             * do not overwrite it blindly.
             */

            if (
                !remoteUpdatedDate
            ) {

                console.warn(
                    "SYNC WORD: remote word has invalid updatedAt:",
                    wordId
                );

            } else {

                const remoteUpdatedAt =
                    remoteUpdatedDate.getTime();


                const baseUpdatedDate =
                    parseSyncTimestamp(
                        word.baseUpdatedAt
                    );


                const localBaseUpdatedAt =
                    baseUpdatedDate
                        ? baseUpdatedDate.getTime()
                        : null;


                /*
                 * Check whether the remote version changed
                 * after the version this local edit started from.
                 */

                const cloudChangedSinceBase =
                    localBaseUpdatedAt !== null &&
                    remoteUpdatedAt >
                        localBaseUpdatedAt;


                const contentChanged =
                    wordContentChanged(
                        word,
                        remoteWord
                    );


                /* ==========================================
                   CONFLICT
                ========================================== */
                console.log(
                    "SYNC CONFLICT CHECK:",
                    {
                        wordId,
                        hasRemoteVersion: remoteSnapshot.exists(),
                        localBaseUpdatedAt:
                            localBaseUpdatedAt,
                        remoteUpdatedAt:
                            remoteUpdatedAt,
                        cloudChangedSinceBase:
                            cloudChangedSinceBase,
                        contentChanged:
                            contentChanged,
                        localWord:
                            word.currentWord,
                        remoteWord:
                            remoteWord?.currentWord
                    }
                );        


                if (
                    cloudChangedSinceBase &&
                    contentChanged
                ) {

                    const conflictId =
                        `word:${wordId}:${remoteUpdatedAt}`;


                    const conflict = {

                        id:
                            conflictId,

                        type:
                            "word",

                        wordId:
                            wordId,

                        localWord:
                            structuredClone(
                                word
                            ),

                        remoteWord:
                            {
                                ...remoteWord,

                                id:
                                    wordId,

                                updatedAt:
                                    remoteUpdatedDate,

                                baseUpdatedAt:
                                    remoteUpdatedDate
                            },

                        detectedAt:
                            new Date(),

                        localUpdatedAt:
                            parseSyncTimestamp(
                                word.updatedAt
                            ),

                        remoteUpdatedAt:
                            remoteUpdatedDate,

                        baseUpdatedAt:
                            baseUpdatedDate,

                        status:
                            "pending"

                    };


                    console.log(
                        "SYNC CONFLICT: saving conflict record...",
                        conflict
                    );

                    await saveConflict(
                        conflict
                    );

                    console.log(
                        "SYNC CONFLICT: conflict record saved:",
                        conflictId
                    );


                    /*
                     * Remove the normal upload queue.
                     * The local version must not overwrite
                     * the Firestore version automatically.
                     */

                    await removeFromSyncQueue(
                        `word:${wordId}`
                    );


                    console.warn(
                        "SYNC CONFLICT DETECTED:",
                        wordId
                    );


                    return false;
                }

            }

        }


        /* ==================================================
           NO CONFLICT → UPLOAD
        ================================================== */

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


        /* ==================================================
           ADVANCE BASE VERSION
        ================================================== */

        const syncedUpdatedDate =
            parseSyncTimestamp(
                word.updatedAt
            );


        if (
            syncedUpdatedDate
        ) {

            const localWords =
                await getWords();


            const currentLocalWord =
                localWords.find(
                    currentWord =>
                        String(
                            currentWord.id
                        ) ===
                        wordId
                );


            /*
             * Only advance the base if the local word
             * is still the exact version we uploaded.
             */

            if (
                currentLocalWord &&
                String(
                    currentLocalWord.updatedAt
                ) ===
                String(
                    word.updatedAt
                )
            ) {

                currentLocalWord.baseUpdatedAt =
                    syncedUpdatedDate;


                await saveWords([
                    currentLocalWord
                ]);

            }

        }


        console.log(
            "Word synchronized with Firestore:",
            wordId
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

/* ==========================================================
   WORD DELETION QUEUE
========================================================== */

export async function queueWordDeletion(
    tombstone
) {

    if (
        !tombstone ||
        !tombstone.recordId
    ) {

        throw new Error(
            "Cannot queue an invalid word deletion."
        );

    }


    await addToSyncQueue({

        id:
            `wordDelete:${tombstone.recordId}`,

        type:
            "wordDelete",

        recordId:
            String(
                tombstone.recordId
            ),

        deletedAt:
            tombstone.deletedAt,

        createdAt:
            new Date().toISOString()

    });


    markSyncPending();

}


/* ==========================================================
   SYNCHRONIZE WORD DELETION
========================================================== */

export async function syncWordDeletion(
    tombstone
) {

    if (!tombstone) {

        throw new Error(
            "Cannot synchronize an empty tombstone."
        );

    }


    if (
        !tombstone.recordId
    ) {

        throw new Error(
            "Cannot synchronize a tombstone without a recordId."
        );

    }


    try {

        markSyncing();


        const wordId =
            String(
                tombstone.recordId
            );


        /* --------------------------------------------------
           Delete word from Firestore
        -------------------------------------------------- */

        const wordRef =
            doc(
                db,
                "words",
                wordId
            );


        await deleteDoc(
            wordRef
        );


        /* --------------------------------------------------
           Delete associated review
        -------------------------------------------------- */

        const reviewRef =
            doc(
                db,
                "reviews",
                wordId
            );


        await deleteDoc(
            reviewRef
        );


        /* --------------------------------------------------
           Store tombstone in Firestore
        -------------------------------------------------- */

        const tombstoneRef =
            doc(
                db,
                "tombstones",
                `word:${wordId}`
            );


        await setDoc(
            tombstoneRef,
            {

                id:
                    `word:${wordId}`,

                type:
                    "word",

                recordId:
                    wordId,

                deletedAt:
                    tombstone.deletedAt,

                createdAt:
                    tombstone.createdAt ||
                    new Date().toISOString()

            }
        );


        console.log(
            "Word deletion synchronized with Firestore:",
            wordId
        );


        return true;

    } catch (error) {

        console.error(
            "Firestore word deletion sync failed:",
            error
        );

        markSyncError();

        throw error;

    }

}


/* ==========================================================
   PROCESS LOCAL SYNC QUEUE
========================================================== */

export async function processSyncQueue() {

    const queue =
        await getSyncQueue();


    if (
        !queue.length
    ) {

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
            words.map(
                word => [
                    String(
                        word.id
                    ),
                    word
                ]
            )
        );


    let failed =
        false;


    for (
        const item
        of queue
    ) {

        try {

            /* ==============================================
               WORD UPDATE
            ============================================== */

            if (
                item.type === "word"
            ) {

                const word =
                    wordsById.get(
                        String(
                            item.recordId
                        )
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


            /* ==============================================
               WORD DELETION
            ============================================== */

            if (
                item.type === "wordDelete"
            ) {

                const tombstone =
                    {

                        id:
                            `word:${item.recordId}`,

                        type:
                            "word",

                        recordId:
                            String(
                                item.recordId
                            ),

                        deletedAt:
                            item.deletedAt,

                        createdAt:
                            item.createdAt

                    };


                await syncWordDeletion(
                    tombstone
                );


                await removeFromSyncQueue(
                    item.id
                );


                console.log(
                    "SYNC QUEUE: completed word deletion:",
                    item.id
                );


                continue;

            }


            /* ==============================================
               REVIEW UPDATE
            ============================================== */

            if (
                item.type === "review"
            ) {

                const review =
                    await getReview(
                        String(
                            item.recordId
                        )
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

        } catch (error) {

            failed =
                true;


            console.error(
                "SYNC QUEUE: item failed:",
                item.id,
                error
            );

        }

    }


    if (
        failed
    ) {

        markSyncError();

    } else {

        markSyncComplete();

    }

}

function parseSyncTimestamp(value) {
    if (!value) {
        return null;
    }

    // Firestore Timestamp
    if (typeof value.toDate === "function") {
        const date = value.toDate();

        if (date instanceof Date && !Number.isNaN(date.getTime())) {
            return date;
        }

        return null;
    }

    // JavaScript Date
    if (value instanceof Date) {
        return !Number.isNaN(value.getTime())
            ? value
            : null;
    }

    // String date
    if (typeof value === "string") {
        const time = Date.parse(value);

        return Number.isNaN(time)
            ? null
            : new Date(time);
    }

    // Unix timestamp in milliseconds
    if (typeof value === "number") {
        // Ignore suspiciously small numbers such as 10.
        if (value < 1000000000000) {
            return null;
        }

        const date = new Date(value);

        return !Number.isNaN(date.getTime())
            ? date
            : null;
    }

    return null;
}

function wordContentChanged(localWord, remoteWord) {

    const fields = [
        "originalWord",
        "currentWord",
        "searchKey",
        "frequency",
        "status",
        "categories",
        "notes"
    ];

    return fields.some(field => {

        const localValue =
            JSON.stringify(
                localWord?.[field] ?? null
            );

        const remoteValue =
            JSON.stringify(
                remoteWord?.[field] ?? null
            );

        return localValue !== remoteValue;
    });
}

/* ==========================================================
   PULL WORDS FROM FIRESTORE
========================================================== */

/* ==========================================================
   PULL WORDS FROM FIRESTORE
========================================================== */

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
                localWords.map(
                    word => [
                        String(word.id),
                        word
                    ]
                )
            );

        /*
         * Get the pending sync queue once.
         *
         * A word in this set has local changes that
         * have not yet been safely synchronized.
         */

        const syncQueue =
            await getSyncQueue();

        const pendingWordIds =
            new Set(
                syncQueue
                    .filter(
                        item =>
                            item.type === "word"
                    )
                    .map(
                        item =>
                            String(
                                item.recordId
                            )
                    )
            );


        /*
         * Get local tombstones once.
         *
         * A locally deleted word must not be
         * resurrected by the cloud pull.
         */

        const localTombstones =
            await getTombstones();

        const deletedWordIds =
            new Set(
                localTombstones
                    .filter(
                        tombstone =>
                            tombstone.type === "word"
                    )
                    .map(
                        tombstone =>
                            String(
                                tombstone.recordId
                            )
                    )
            );


        let imported = 0;
        let updated = 0;
        let conflicts = 0;
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


            /* ==================================================
               LOCAL TOMBSTONE PROTECTION
            ================================================== */

            if (
                deletedWordIds.has(
                    remoteId
                )
            ) {

                console.log(
                    "SYNC PULL: ignoring remotely existing word because local tombstone exists:",
                    remoteId
                );

                skipped++;

                continue;
            }


            /* ==================================================
               VALIDATE REMOTE UPDATED AT
            ================================================== */

            const remoteUpdatedDate =
                parseSyncTimestamp(
                    remoteWord.updatedAt
                );


            if (!remoteUpdatedDate) {

                console.warn(
                    "SYNC PULL: invalid remote updatedAt for word:",
                    remoteId,
                    remoteWord.updatedAt
                );

                skipped++;

                continue;
            }


            const localWord =
                localById.get(
                    remoteId
                );


            /* ==================================================
               WORD DOES NOT EXIST LOCALLY
            ================================================== */

            if (!localWord) {

                const createdAt =
                    parseSyncTimestamp(
                        remoteWord.createdAt
                    ) ?? new Date();


                await saveWords([
                    {

                        ...remoteWord,

                        id:
                            remoteId,

                        createdAt,

                        updatedAt:
                            remoteUpdatedDate,

                        /*
                         * This is now the cloud version
                         * that this local copy is based on.
                         */

                        baseUpdatedAt:
                            remoteUpdatedDate

                    }
                ]);


                imported++;

                continue;
            }


            /* ==================================================
               LOCAL TIMESTAMP
            ================================================== */

            const localUpdatedDate =
                parseSyncTimestamp(
                    localWord.updatedAt
                );


            const localUpdatedAt =
                localUpdatedDate
                    ? localUpdatedDate.getTime()
                    : 0;


            /* ==================================================
               LOCAL BASE TIMESTAMP
            ================================================== */

            const baseUpdatedDate =
                parseSyncTimestamp(
                    localWord.baseUpdatedAt
                );


            /*
             * Older records created before baseUpdatedAt
             * existed may not have the field.
             *
             * In that case, use the local updatedAt as
             * the best available baseline.
             */

            const baseUpdatedAt =
                baseUpdatedDate
                    ? baseUpdatedDate.getTime()
                    : localUpdatedAt;


            /* ==================================================
               REMOTE TIMESTAMP
            ================================================== */

            const remoteUpdatedAt =
                remoteUpdatedDate.getTime();


            /* ==================================================
               ACTUAL CONTENT COMPARISON
            ================================================== */

            const contentChanged =
                wordContentChanged(
                    localWord,
                    remoteWord
                );


            /* ==================================================
               PENDING LOCAL EDIT
            ================================================== */

            const hasPendingLocalEdit =
                pendingWordIds.has(
                    remoteId
                );


            /* ==================================================
               CONFLICT DETECTION
            ==================================================

               A conflict exists when:

               1. This device has a local edit waiting
                  to be synchronized.

               2. Firestore has changed since the version
                  this local edit was based on.

               3. The actual word data is different.

               This does NOT depend on which phone has
               the larger local clock value.
            ================================================== */

            const cloudChangedSinceBase =
                remoteUpdatedAt >
                baseUpdatedAt;


            if (
                hasPendingLocalEdit &&
                contentChanged &&
                cloudChangedSinceBase
            ) {

                const conflictId =
                    `word:${remoteId}:${remoteUpdatedAt}`;


                const conflict = {

                    id:
                        conflictId,

                    type:
                        "word",

                    wordId:
                        remoteId,

                    /*
                     * Preserve the exact local version.
                     */

                    localWord:
                        structuredClone(
                            localWord
                        ),

                    /*
                     * Preserve the exact remote version.
                     */

                    remoteWord:
                        {
                            ...remoteWord,

                            id:
                                remoteId,

                            createdAt:
                                parseSyncTimestamp(
                                    remoteWord.createdAt
                                ) ??
                                localWord.createdAt,

                            updatedAt:
                                remoteUpdatedDate,

                            baseUpdatedAt:
                                remoteUpdatedDate
                        },

                    detectedAt:
                        new Date(),

                    localUpdatedAt:
                        localUpdatedDate ??
                        null,

                    remoteUpdatedAt:
                        remoteUpdatedDate,

                    baseUpdatedAt:
                        baseUpdatedDate ??
                        null,

                    status:
                        "pending"

                };


                /*
                 * Store both versions locally.
                 */

                await saveConflict(
                    conflict
                );


                /*
                 * Remove the normal local upload
                 * from the queue.
                 *
                 * This is critical:
                 *
                 * Phone B must NOT upload its local
                 * version over Phone A's cloud version
                 * while the conflict is unresolved.
                 */

                await removeFromSyncQueue(
                    `word:${remoteId}`
                );


                conflicts++;


                console.warn(
                    "SYNC CONFLICT DETECTED:",
                    remoteId
                );


                continue;
            }


            /* ==================================================
               REMOTE IS NEWER BUT THERE IS NO CONFLICT
            ================================================== */

            if (
                remoteUpdatedAt >
                localUpdatedAt
            ) {

                const remoteCreatedDate =
                    parseSyncTimestamp(
                        remoteWord.createdAt
                    );


                await saveWords([
                    {

                        ...remoteWord,

                        id:
                            localWord.id,

                        createdAt:
                            remoteCreatedDate ??
                            localWord.createdAt,

                        updatedAt:
                            remoteUpdatedDate,

                        /*
                         * The local word is now based
                         * on this cloud version.
                         */

                        baseUpdatedAt:
                            remoteUpdatedDate

                    }
                ]);


                updated++;

                continue;
            }


            /* ==================================================
               LOCAL IS NEWER / VERSIONS ARE EQUAL
            ================================================== */

            skipped++;

        }


        markSyncComplete();


        console.log(
            "SYNC PULL COMPLETE:",
            {
                imported,
                updated,
                conflicts,
                skipped
            }
        );


        return {

            imported,
            updated,
            conflicts,
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
   REVIEW QUEUE
========================================================== */

export async function queueReviewSync(
    review
) {

    if (
        !review ||
        !review.wordId
    ) {

        throw new Error(
            "Cannot queue an invalid review."
        );

    }


    await addToSyncQueue({

        id:
            `review:${review.wordId}`,

        type:
            "review",

        recordId:
            String(
                review.wordId
            ),

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
   REVIEW CLOUD SYNC
========================================================== */

export async function syncReview(
    review
) {

    if (!review) {

        throw new Error(
            "Cannot synchronize an empty review."
        );

    }


    if (
        !review.wordId
    ) {

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
                String(
                    review.wordId
                )
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
   PULL REVIEWS FROM FIRESTORE
========================================================== */

export async function pullReviewsFromFirestore() {

    try {

        markSyncing();


        console.log(
            "SYNC PULL: downloading reviews from Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "reviews"
                )
            );


        let imported = 0;

        let updated = 0;

        let skipped = 0;


        for (
            const documentSnapshot
            of snapshot.docs
        ) {

            const remoteReview =
                documentSnapshot.data();


            const remoteWordId =
                String(
                    remoteReview.wordId ??
                    documentSnapshot.id
                );


            const localReview =
                await getReview(
                    remoteWordId
                );


            /* ----------------------------------------------
               Review does not exist locally
            ---------------------------------------------- */

            if (
                !localReview
            ) {

                await saveReview({

                    ...remoteReview,

                    wordId:
                        remoteWordId,

                    updatedAt:
                        remoteReview.updatedAt
                            ? new Date(
                                remoteReview.updatedAt
                            )
                            : new Date()

                });


                imported++;

                continue;

            }


            /* ----------------------------------------------
               Compare timestamps
            ---------------------------------------------- */

            const localUpdatedAt =
                new Date(
                    localReview.updatedAt
                ).getTime();


            const remoteUpdatedAt =
                new Date(
                    remoteReview.updatedAt
                ).getTime();


            if (
                Number.isNaN(
                    remoteUpdatedAt
                )
            ) {

                console.warn(
                    "SYNC PULL: invalid remote review updatedAt:",
                    remoteWordId
                );


                skipped++;

                continue;

            }


            /* ----------------------------------------------
               Remote review is newer
            ---------------------------------------------- */

            if (
                remoteUpdatedAt >
                localUpdatedAt
            ) {

                await saveReview({

                    ...remoteReview,

                    wordId:
                        localReview.wordId,

                    updatedAt:
                        remoteReview.updatedAt
                            ? new Date(
                                remoteReview.updatedAt
                            )
                            : localReview.updatedAt

                });


                updated++;

                continue;

            }


            skipped++;

        }


        markSyncComplete();


        console.log(
            "SYNC REVIEW PULL COMPLETE:",
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
            "SYNC REVIEW PULL FAILED:",
            error
        );


        markSyncError();


        throw error;

    }

}


/* ==========================================================
   PULL TOMBSTONES FROM FIRESTORE
========================================================== */

export async function pullTombstonesFromFirestore() {

    try {

        markSyncing();


        console.log(
            "SYNC TOMBSTONES: downloading deletions from Firestore..."
        );


        const snapshot =
            await getDocs(
                collection(
                    db,
                    "tombstones"
                )
            );


        let applied = 0;

        let skipped = 0;


        for (
            const documentSnapshot
            of snapshot.docs
        ) {

            const remoteTombstone =
                documentSnapshot.data();


            if (
                remoteTombstone.type !== "word"
            ) {

                skipped++;

                continue;

            }


            const wordId =
                String(
                    remoteTombstone.recordId ??
                    ""
                );


            if (!wordId) {

                skipped++;

                continue;

            }


            const localWords =
                await getWords();


            const localWord =
                localWords.find(
                    word =>
                        String(
                            word.id
                        ) === wordId
                );


            const localReview =
                await getReview(
                    wordId
                );


            const remoteDeletedAt =
                new Date(
                    remoteTombstone.deletedAt
                ).getTime();


            if (
                Number.isNaN(
                    remoteDeletedAt
                )
            ) {

                console.warn(
                    "SYNC TOMBSTONES: invalid deletion timestamp:",
                    wordId
                );


                skipped++;

                continue;

            }


            /* ----------------------------------------------
               Delete if there is no local word/review,
               or the remote deletion is newer.
            ---------------------------------------------- */

            let shouldDelete =
                false;


            if (
                localWord
            ) {

                const localUpdatedAt =
                    new Date(
                        localWord.updatedAt
                    ).getTime();


                if (
                    Number.isNaN(
                        localUpdatedAt
                    ) ||
                    remoteDeletedAt >=
                    localUpdatedAt
                ) {

                    shouldDelete =
                        true;

                }

            } else if (
                localReview
            ) {

                const localReviewUpdatedAt =
                    new Date(
                        localReview.updatedAt
                    ).getTime();


                if (
                    Number.isNaN(
                        localReviewUpdatedAt
                    ) ||
                    remoteDeletedAt >=
                    localReviewUpdatedAt
                ) {

                    shouldDelete =
                        true;

                }

            }


            if (
                shouldDelete
            ) {

                if (
                    localWord
                ) {

                    await deleteWord(
                        wordId
                    );

                }


                if (
                    localReview
                ) {

                    await deleteReview(
                        wordId
                    );

                }


                applied++;

            }


            /* ----------------------------------------------
               Keep tombstone locally
            ---------------------------------------------- */

            await saveTombstone({

                id:
                    `word:${wordId}`,

                type:
                    "word",

                recordId:
                    wordId,

                deletedAt:
                    remoteTombstone.deletedAt,

                createdAt:
                    remoteTombstone.createdAt

            });

        }


        markSyncComplete();


        console.log(
            "SYNC TOMBSTONES COMPLETE:",
            {
                applied,
                skipped
            }
        );


        return {
            applied,
            skipped
        };

    } catch (error) {

        console.error(
            "SYNC TOMBSTONES FAILED:",
            error
        );


        markSyncError();


        throw error;

    }

}


/* ==========================================================
   LOCAL TOMBSTONE INFORMATION
========================================================== */

export async function getLocalTombstones() {

    return await getTombstones();

}


/* ==========================================================
   INITIALIZE SYNC STATUS
========================================================== */

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

        status =
            savedStatus;

    } else {

        status =
            "idle";

    }

}