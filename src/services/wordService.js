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
    queueWordSync
} from "./syncService.js";
import { normalizeArabic } from "../utils/arabicNormalizer.js";


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

    await queueWordSync(word);

    // =====================================
    // CLOUD SYNC
    // =====================================

    try {

        await syncWord(word);

    } catch (error) {

        /*
         * Local data has already been saved.
         *
         * A Firebase/network failure must NOT
         * prevent the user from continuing to
         * work with the local dictionary.
         */

        console.error(
            "Cloud synchronization failed. " +
            "Word was saved locally:",
            error
        );

    }

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
            wordId: targetWord.id
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


    // =====================================
    // Synchronize surviving word
    // =====================================

    try {

        await syncWord(
            targetWord
        );

    } catch (error) {

        console.error(
            "Cloud synchronization failed after merge. " +
            "Merge was saved locally:",
            error
        );

    }


    return targetWord;

}
