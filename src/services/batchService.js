import {
    saveSetting,
    saveBatch,
    getBatch,
    getBatches,
    deleteBatch,
    getWordIdsInBatches,
    getWordIdsAfter,
    getFirstWordIdsForGeneration,
    createNextBatchAtomically
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

/**
 * Create a small test batch from the first words.
 *
 * This is only for testing.
 */
/**
 * Create a test batch using the first N words.
 *
 * This function is for controlled testing only.
 */
export async function createTestBatch(
    limit = 10,
    batchId = "TEST-BATCH-001"
) {

    const {
        getFirstWordIds
    } = await import("../database/db.js");

    const wordIds =
        await getFirstWordIds(limit);

    if (wordIds.length === 0) {
        throw new Error("No words found.");
    }

    return await createBatch({

        id: batchId,

        stage: "first",

        reviewerId: "test-reviewer",

        wordIds

    });
}

window.testBatch = async () => {

    const batch =
        await createTestBatch(10);

    console.log(
        "TEST BATCH CREATED:",
        batch
    );

    console.log(
        "Word count:",
        batch.wordIds.length
    );
};

/**
 * Generate exactly one next batch.
 *
 * The next batch starts after the last word ID
 * assigned to the previous batch.
 */
export async function generateNextBatch({
    batchSize = 1000,
    stage = "first",
    reviewerId = null
} = {}) {

    return await createNextBatchAtomically({
        batchSize,
        stage,
        reviewerId
    });
}

/**
 * Reset development batch data.
 *
 * Removes only the batches created during testing
 * and resets the batch allocator.
 *
 * DO NOT use this after real production batches exist.
 */
export async function resetTestBatches() {

    const testBatchIds = [
        "TEST-BATCH-001",
        "BATCH-0001"
    ];

    for (const batchId of testBatchIds) {

        const batch =
            await getBatch(batchId);

        if (batch) {
            await deleteBatch(batchId);
        }
    }

    /*
     * Reset persistent allocator.
     */
    await saveSetting(
        "batchNextNumber",
        1
    );

    await saveSetting(
        "batchLastWordId",
        null
    );

    return true;
}