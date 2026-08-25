import {
    getWord,
    updateWord,
    findWordBySearchKey,
    deleteWord,
    getReview,
    saveReview,
    deleteReview,
    mergeWords as mergeWordsInDatabase
} from "../repositories/WordRepository.js";

import { normalizeArabic } from "../utils/arabicNormalizer.js";


export async function loadWord(id) {

    return await getWord(id);

}


export async function saveWord(word) {

    if (!word) {

        throw new Error("Word is required.");

    }


    word.searchKey =
        normalizeArabic(
            word.currentWord
        );


    word.updatedAt =
        new Date();


    await updateWord(word);

}


export async function checkDuplicate( wordId,currentWord) {

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


export async function mergeWords(sourceWord,targetWord) {

    if (!sourceWord || !targetWord) {

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


    return targetWord;

}


