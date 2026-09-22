import {
    saveBatch,
    getBatch,
    getBatches,
    deleteBatch,
    getWordIdsInBatches
} from "../database/db.js";


/**
 * Create a new batch.
 */
export async function createBatch({
    id,
    stage = "first",
    reviewerId = null,
    wordIds = []
}) {

    if (!id) {
        throw new Error("Batch ID is required.");
    }

    const now = new Date();

    const batch = {

        id,

        stage,

        reviewerId,

        status: "pending",

        wordIds,

        totalWords: wordIds.length,

        reviewedWords: 0,

        acceptedWords: 0,

        rejectedWords: 0,

        createdAt: now,

        updatedAt: now
    };

    await saveBatch(batch);

    return batch;
}


/**
 * Generate batches from all words.
 *
 * Important:
 * Words are streamed from IndexedDB.
 * The full dictionary is never loaded into memory.
 */
export async function generateBatches({
    batchSize = 1000,
    stage = "first",
    reviewerId = null
} = {}) {

    let batchNumber = 1;

    let generated = 0;

    await getWordIdsInBatches(
        batchSize,
        async wordIds => {

            const id =
                `BATCH-${String(batchNumber)
                    .padStart(4, "0")}`;

            await createBatch({
                id,
                stage,
                reviewerId,
                wordIds
            });

            generated += wordIds.length;

            console.log(
                `Created ${id} with ${wordIds.length} words`
            );

            batchNumber++;
        }
    );

    return {
        batchesCreated: batchNumber - 1,
        wordsAssigned: generated
    };
}


/**
 * Get one batch.
 */
export async function loadBatch(batchId) {
    return await getBatch(batchId);
}


/**
 * Get all batches.
 */
export async function loadBatches() {
    return await getBatches();
}


/**
 * Update an existing batch.
 */
export async function updateBatch(batch) {

    if (!batch || !batch.id) {
        throw new Error("Valid batch is required.");
    }

    batch.updatedAt = new Date();

    await saveBatch(batch);

    return batch;
}


/**
 * Delete one batch.
 */
export async function removeBatch(batchId) {

    if (!batchId) {
        throw new Error("Batch ID is required.");
    }

    await deleteBatch(batchId);
}