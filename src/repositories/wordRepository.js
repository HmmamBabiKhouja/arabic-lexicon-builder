import {
    mergeWordRecords,
    saveWords,
    getWords,
    getWordBySearchKey,
    getWordsBySearchKey,
    deleteWord as deleteWordFromDatabase,
    getReview as getReviewFromDatabase,
    saveReview as saveReviewToDatabase,
    deleteReview as deleteReviewFromDatabase
} from "../database/db.js";

import { createBatches } from "../utils/batch.js";


const BATCH_SIZE = 1000;


/**
 * Delete one word
 */
export async function deleteWord(wordId) {

    await deleteWordFromDatabase(
        wordId
    );

}


/**
 * Import words in batches
 */
export async function importWords(words) {

    const batches =
        createBatches(
            words,
            BATCH_SIZE
        );


    for (
        let i = 0;
        i < batches.length;
        i++
    ) {

        console.log(
            `Saving batch ${i + 1} / ${batches.length}`
        );


        await saveWords(
            batches[i]
        );

    }

}


/**
 * Load all words
 */
export async function loadWords() {

    return await getWords();

}


/**
 * Load dictionary
 */
export async function loadDictionary() {

    return await getWords();

}


/**
 * Get one word by ID
 */
export async function getWord(id) {

    const words =
        await getWords();


    return (
        words.find(word => word.id === id) ?? null
    );

}


/**
 * Update one word
 */
export async function updateWord(updatedWord) {

    await saveWords([updatedWord]);

}


/**
 * Find a word by its current word
 *
 * Kept for compatibility with existing code.
 */
export async function findWordByCurrentWord(currentWord) {

    const words =
        await getWords();


    return (
        words.find(word =>word.currentWord === currentWord) ?? null
    );

}


/**
 * Find a word by searchKey
 *
 * Uses the IndexedDB searchKey index
 * instead of loading the entire dictionary.
 */
export async function findWordBySearchKey(searchKey) {

    return await getWordBySearchKey(searchKey);

}


/**
 * Get review for a word
 */
export async function getReview(wordId) {

    return await getReviewFromDatabase(wordId);

}


/**
 * Save review
 */
export async function saveReview(review) {

    await saveReviewToDatabase(review);

}


/**
 * Delete review
 */
export async function deleteReview(wordId) {

    await deleteReviewFromDatabase(wordId);

}


/**
 * Merge two words
 *
 * The actual database transaction
 * is handled by db.js.
 */
export async function mergeWords(sourceWord,targetWord,mergedReview = null) {

    await mergeWordRecords(sourceWord,targetWord,mergedReview);

}

