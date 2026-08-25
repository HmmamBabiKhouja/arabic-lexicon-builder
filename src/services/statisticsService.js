import {
    loadDictionary
} from "../repositories/WordRepository.js";

export async function getStatistics() {

    const words =
        await loadDictionary();

    const total =
        words.length;

    const reviewed =
        words.filter(word =>

            word.status !== "pending"

        ).length;

    const remaining =
        total - reviewed;

    const percent =
        total === 0
            ? 0
            : (reviewed / total * 100);

    return {

        total,
        reviewed,
        remaining,
        percent

    };

}