import {
    searchWordsFromDatabase
} from "../repositories/searchRepository.js";

export async function searchWords(query) {

    const normalized = query.trim();

    if (!normalized) {

        return [];

    }

    return await searchWordsFromDatabase(normalized);

}