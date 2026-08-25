import {
    searchWordsFromDatabase
} from "../repositories/searchRepository.js";

import {
    normalizeArabic
} from "../utils/arabicNormalizer.js";


export async function searchWords(query) {

    const normalizedQuery =
        normalizeArabic(query);

    if (!normalizedQuery) {

        return [];

    }

    return await searchWordsFromDatabase(
        normalizedQuery
    );

}


export async function search(query) {

    return await searchWords(query);

}
