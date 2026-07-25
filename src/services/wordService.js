import {
    getWord,
    updateWord
} from "../repositories/WordRepository.js";


export async function loadWord(id) {

    return await getWord(id);

}

export async function saveWord(word) {

    if (!word) {

        throw new Error("Word is required.");

    }

    word.updatedAt = new Date();

    await updateWord(word);

}