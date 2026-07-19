import {
    saveReview,
    getReview
} from "../database/db.js";

export async function saveWordReview(review) {

    await saveReview(review);

}

export async function loadWordReview(wordId) {

    return await getReview(wordId);

}