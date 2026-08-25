import {
    mergeWordRecords,
    saveWords,
    getWords,
    deleteWord as deleteWordFromDatabase,
    getReview as getReviewFromDatabase,
    saveReview as saveReviewToDatabase,
    deleteReview as deleteReviewFromDatabase
} from "../database/db.js";

import { createBatches } from "../utils/batch.js";


export async function deleteWord(wordId) {

    await deleteWordFromDatabase(wordId);

}

const BATCH_SIZE = 1000;

export async function importWords(words) {

    const batches = createBatches(
        words,
        BATCH_SIZE
    );

    for (let i = 0; i < batches.length; i++) {

        console.log(
            `Saving batch ${i + 1} / ${batches.length}`
        );

        await saveWords(
            batches[i]
        );

    }

}

export async function loadWords() {

    return await getWords();

}

export async function loadDictionary() {

    return await getWords();

}

export async function getWord(id) {

    const words = await getWords();

    console.log("Loaded", words.length, "words");
    console.log("First word:", words[0]);

    return words.find(word => word.id === id) ?? null;

}

export async function updateWord(updatedWord) {

    await saveWords([updatedWord]);

}

export async function findWordByCurrentWord(currentWord) {

    const words = await getWords();

    return words.find(word =>
        word.currentWord === currentWord
    ) ?? null;

}

export async function findWordBySearchKey(searchKey) {

    const words =
        await getWords();


    return words.find(word =>

        word.searchKey === searchKey

    ) ?? null;

}

export async function getReview(wordId) {

    return await getReviewFromDatabase(wordId);

}

export async function saveReview(review) {

    await saveReviewToDatabase(review);

}

export async function deleteReview(wordId) {

    await deleteReviewFromDatabase(wordId);

}

export async function mergeWords(
    sourceWord,
    targetWord,
    mergedReview = null
) {

    await mergeWordRecords(
        sourceWord,
        targetWord,
        mergedReview
    );

}
