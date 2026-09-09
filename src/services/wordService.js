/* ==========================================================
   Mu'jam - Word Service
========================================================== */

import {
    getWord,
    updateWord,
    findWordBySearchKey,
    deleteWord,
    getReview,
    saveReview,
    deleteReview,
    mergeWords as mergeWordsInDatabase
} from "../repositories/wordRepository.js";

import {
    syncWord,
    queueWordSync,
    queueWordDeletion,
    syncReview
} from "./syncService.js";

import {
    normalizeArabic
} from "../utils/arabicNormalizer.js";

import {
    saveTombstone
} from "../database/db.js";

import {
    upsertWordInMemory,
    removeWordFromMemory
} from "./dictionaryState.js";


/**
 * Load one word
 */
export async function loadWord(id) {

    return await getWord(id);

}


/**
 * Save one word locally and synchronize
 * it with Firestore.
 */
export async function saveWord(word) {

    if (!word) {

        throw new Error(
            "Word is required."
        );

    }


    // =====================================
    // Update searchable value
    // =====================================

    word.searchKey =
        normalizeArabic(
            word.currentWord
        );


    // =====================================
    // Update modification timestamp
    // =====================================

    word.updatedAt =
        new Date();


    // =====================================
    // LOCAL SAVE
    // =====================================

    await updateWord(word);

    upsertWordInMemory(word);


    // =====================================
    // QUEUE CLOUD SYNCHRONIZATION
    // =====================================

    await queueWordSync(word);


    /*
     * Do not wait for Firestore.
     *
     * The local save is already complete.
     * Firestore synchronization happens in the
     * background and cannot block the editor.
     */

    void syncWord(
        word
    ).catch(error => {

        console.error(
            "Cloud synchronization failed. " +
            "Word was saved locally and remains queued:",
            error
        );

    });

}


/**
 * Delete one word locally and synchronize
 * the deletion with Firestore.
 */
export async function removeWord(wordId) {

    if (
        wordId === null ||
        wordId === undefined
    ) {

        throw new Error(
            "Word ID is required."
        );

    }


    const word =
        await getWord(
            wordId
        );


    if (!word) {

        throw new Error(
            "Word not found."
        );

    }


    // =====================================
    // Deletion timestamp
    // =====================================

    const deletedAt =
        new Date();


    // =====================================
    // LOCAL DELETE
    // =====================================

    await deleteWord(
        wordId
    );

    removeWordFromMemory(wordId);


    // =====================================
    // DELETE ASSOCIATED REVIEW
    // =====================================

    await deleteReview(
        wordId
    );


    // =====================================
    // CREATE LOCAL TOMBSTONE
    // =====================================

    const tombstone = {

        id: `word:${wordId}`,

        type: "word",

        recordId: String(
            wordId
        ),

        deletedAt: deletedAt.toISOString()

    };


    await saveTombstone(
        tombstone
    );


    // =====================================
    // QUEUE DELETION
    // =====================================

    await queueWordDeletion(
        tombstone
    );


    /*
     * Do not wait for Firestore.
     *
     * The local deletion has already completed.
     * Cloud deletion happens in the background.
     */

    console.log(
        "Word deleted locally:",
        wordId
    );

}


/**
 * Check whether another word already
 * uses the same normalized searchKey.
 */
export async function checkDuplicate(
    wordId,
    currentWord
) {

    const searchKey =
        normalizeArabic(
            currentWord
        );


    if (!searchKey) {

        return null;

    }


    const existing =
        await findWordBySearchKey(
            searchKey
        );


    if (!existing) {

        return null;

    }


    if (
        String(existing.id) ===
        String(wordId)
    ) {

        return null;

    }


    return existing;

}


/**
 * Merge two words.
 */
export async function mergeWords(
    sourceWord,
    targetWord
) {

    if (
        !sourceWord ||
        !targetWord
    ) {

        throw new Error(
            "Both words are required for merging."
        );

    }


    if (
        String(sourceWord.id) ===
        String(targetWord.id)
    ) {

        throw new Error(
            "Cannot merge a word with itself."
        );

    }


    // =====================================
    // Merge categories
    // =====================================

    const sourceCategories =
        Array.isArray(
            sourceWord.categories
        )
            ? sourceWord.categories
            : [];


    const targetCategories =
        Array.isArray(
            targetWord.categories
        )
            ? targetWord.categories
            : [];


    targetWord.categories = [
        ...new Set([
            ...targetCategories,
            ...sourceCategories
        ])
    ];


    // =====================================
    // Merge notes
    // =====================================

    const sourceNotes =
        (
            sourceWord.notes ||
            ""
        ).trim();


    const targetNotes =
        (
            targetWord.notes ||
            ""
        ).trim();


    if (
        sourceNotes &&
        targetNotes
    ) {

        if (
            !targetNotes.includes(
                sourceNotes
            )
        ) {

            targetWord.notes =
                targetNotes +
                "\n\n--- ملاحظة من السجل المدموج ---\n\n" +
                sourceNotes;

        }

    } else if (
        sourceNotes
    ) {

        targetWord.notes =
            sourceNotes;

    }


    // =====================================
    // Keep the higher frequency
    // =====================================

    targetWord.frequency =
        Math.max(
            Number(
                targetWord.frequency || 0
            ),
            Number(
                sourceWord.frequency || 0
            )
        );


    // =====================================
    // Prepare review migration
    // =====================================

    const sourceReview =
        await getReview(
            sourceWord.id
        );


    const targetReview =
        await getReview(
            targetWord.id
        );


    let mergedReview = null;


    if (
        !targetReview &&
        sourceReview
    ) {

        mergedReview = {

            ...sourceReview,

            wordId:
                targetWord.id,

            updatedAt:
                new Date()

        };

    }


    // =====================================
    // Update metadata
    // =====================================

    targetWord.searchKey =
        normalizeArabic(
            targetWord.currentWord
        );


    targetWord.updatedAt =
        new Date();


    // =====================================
    // Atomic database operation
    // =====================================

    await mergeWordsInDatabase(
        sourceWord,
        targetWord,
        mergedReview
    );

    upsertWordInMemory(targetWord);
    removeWordFromMemory(sourceWord.id);


    // =====================================
    // Create tombstone for source word
    // =====================================

    const sourceTombstone = {

        id:
            `word:${sourceWord.id}`,

        type:
            "word",

        recordId:
            String(
                sourceWord.id
            ),

        deletedAt:
            new Date().toISOString()

    };


    await saveTombstone(
        sourceTombstone
    );


    // =====================================
    // Queue source deletion
    // =====================================

    await queueWordDeletion(
        sourceTombstone
    );


    // =====================================
    // Synchronize surviving target word
    // =====================================

    void syncWord(
        targetWord
    ).catch(error => {

        console.error(
            "Cloud synchronization failed after merge. " +
            "Merged word remains saved locally:",
            error
        );

    });


    // =====================================
    // Synchronize migrated review
    // =====================================

    if (mergedReview) {

        void syncReview(
            mergedReview
        ).catch(error => {

            console.error(
                "Cloud review synchronization failed after merge:",
                error
            );

        });

    }


    return targetWord;

}