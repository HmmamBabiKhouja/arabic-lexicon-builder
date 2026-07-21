import {
    searchWords
} from "../repositories/SearchRepository.js";

export async function search(query) {

    if (!query.trim()) {

        return [];

    }

    return await searchWords(query);

}