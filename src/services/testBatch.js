import {
    createBatch,
    loadBatch,
    loadBatches,
    removeBatch
} from "./batchService.js";

async function testBatch() {
    console.log("Creating test batch...");

    await createBatch({
        id: "BATCH-0001",
        stage: "first",
        reviewerId: "reviewer-001",
        wordIds: [1, 2, 3, 4, 5]
    });

    const batch = await loadBatch("BATCH-0001");

    console.log("ONE BATCH:", batch);

    const batches = await loadBatches();

    console.log("ALL BATCHES:", batches);

    await removeBatch("BATCH-0001");

    console.log("Test batch deleted.");
}

testBatch().catch(console.error);