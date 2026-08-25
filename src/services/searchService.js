import { loadDictionary } from "../repositories/WordRepository.js";
import { normalizeArabic } from "../utils/arabicNormalizer.js";

export async function searchWords(query) {

    const normalizedQuery =
        normalizeArabic(query);

    if (!normalizedQuery) {

        return [];

    }

    const words =
        await loadDictionary();

    return words.filter(word => {

        const searchKey =
            word.searchKey ||
            normalizeArabic(word.currentWord);

        return searchKey.includes(
            normalizedQuery
        );

    });

}

export async function search(query) {

    return await searchWords(query);

}