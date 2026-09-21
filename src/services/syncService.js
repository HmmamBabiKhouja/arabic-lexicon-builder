/* ==========================================================
   Mu'jam - Sync Service
   Two-way synchronization foundation
========================================================== */

import {
    collection,
    doc,
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
    getTombstones
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


        const wordRef =
            doc(
                db,
                "words",
                String(
                    word.id
                )
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
                        String(
                            word.id
                        ),
                        word
                    ]
                )
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


            /* ----------------------------------------------
               Word does not exist locally
            ---------------------------------------------- */

            if (
                !localWord
            ) {

                await saveWords([
                    {

                        ...remoteWord,

                        id:
                            remoteId,

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


            /* ----------------------------------------------
               Compare timestamps
            ---------------------------------------------- */

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


            /* ----------------------------------------------
               Remote is newer
            ---------------------------------------------- */

            if (
                remoteUpdatedAt >
                localUpdatedAt
            ) {

                await saveWords([
                    {

                        ...remoteWord,

                        id:
                            localWord.id,

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