import {
    saveWordReview,
    loadWordReview
} from "../repositories/reviewRepository.js";

import {
    queueReviewSync,
    syncReview
} from "./syncService.js";


/**
 * Saves the review of a word.
 *
 * Local IndexedDB save happens first.
 * Cloud synchronization happens afterward.
 */
export async function saveReview(
    wordId,
    categories
) {

    const review = {

        wordId,

        categories,

        notes: "",

        accepted: true,

        updatedAt: new Date()

    };


    // =====================================
    // LOCAL SAVE
    // =====================================

    await saveWordReview(
        review
    );


    // =====================================
    // QUEUE
    // =====================================

    await queueReviewSync(
        review
    );


    // =====================================
    // BACKGROUND CLOUD SYNC
    // =====================================

    void syncReview(
        review
    ).catch(error => {

        console.error(
            "Cloud synchronization failed. " +
            "Review was saved locally and remains queued:",
            error
        );

    });

}


/**
 * Loads the review of a word.
 */
export async function getReview(
    wordId
) {

    return await loadWordReview(
        wordId
    );

}
