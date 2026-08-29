import {
    saveWordReview,
    loadWordReview
} from "../repositories/ReviewRepository.js";

/**
 * Saves the review of a word.
 */
export async function saveReview(wordId, categories) {

    const review = {

        wordId,

        categories,

        notes: "",

        accepted: true,

        updatedAt: new Date()

    };

    await saveWordReview(review);

}

/**
 * Loads the review of a word.
 */
export async function getReview(wordId) {

    return await loadWordReview(wordId);

}