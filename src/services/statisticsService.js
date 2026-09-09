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
            word.status === "reviewed"
        ).length;

    const rejected =
        words.filter(word =>
            word.status === "rejected"
        ).length;

    const remaining =
        words.filter(word =>
            !word.status || word.status === "pending"
        ).length;

    const processed =
        reviewed + rejected;

    const percent =
        total === 0
            ? 0
            : (processed / total * 100);

    return {

        total,
        reviewed,
        rejected,
        remaining,
        processed,
        percent

    };

}
