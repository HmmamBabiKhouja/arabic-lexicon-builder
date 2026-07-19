import {
    saveWords,
    getWords
} from "../database/db.js";

export async function importWords(words) {

    await saveWords(words);

}

export async function loadWords() {

    return await getWords();

}