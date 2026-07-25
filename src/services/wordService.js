import {
    getWord,
    updateWord,
    findWordByCurrentWord
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

export async function checkDuplicate(wordId, currentWord) {

    const existing =
        await findWordByCurrentWord(currentWord);

    if (!existing) {

        return null;

    }

    if (existing.id === wordId) {

        return null;

    }

    return existing;

}