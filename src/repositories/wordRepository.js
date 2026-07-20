import { saveWords } from "../database/db.js";
import { getWords } from "../database/db.js";
import { createBatches } from "../utils/batch.js";

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