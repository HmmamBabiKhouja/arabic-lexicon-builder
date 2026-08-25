import {
    getWord,
    updateWord,
    findWordBySearchKey
} from "../repositories/WordRepository.js";

import {
    normalizeArabic
} from "../utils/arabicNormalizer.js";


export async function loadWord(id) {

    return await getWord(id);

}


export async function saveWord(word) {

    if (!word) {

        throw new Error("Word is required.");

    }


    word.searchKey =
        normalizeArabic(
            word.currentWord
        );


    word.updatedAt =
        new Date();


    await updateWord(word);

}


export async function checkDuplicate(
    wordId,
    currentWord
) {

    const searchKey =
        normalizeArabic(
            currentWord
        );


    if (!searchKey) {

        return null;

    }


    const existing =
        await findWordBySearchKey(
            searchKey
        );


    if (!existing) {

        return null;

    }


    if (
        String(existing.id) ===
        String(wordId)
    ) {

        return null;

    }


    return existing;

}
