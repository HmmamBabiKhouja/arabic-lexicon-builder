import { loadDictionary } from "../repositories/WordRepository.js";
import { loadCurrentIndex } from "./settingsService.js";
import { getStatistics } from "./statisticsService.js";

export async function getHomeState() {

    const words =
        await loadDictionary();

    const totalWords =
        words.length;

    const currentIndex =
        await loadCurrentIndex();

    const statistics =
        await getStatistics();

    return {

        hasDictionary:
            totalWords > 0,

        totalWords,

        currentIndex,

        statistics

    };

}


export async function hasDictionary() {

    const words =
        await loadDictionary();

    return words.length > 0;

}
