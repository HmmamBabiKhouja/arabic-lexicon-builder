import { loadDictionary } from "../repositories/WordRepository.js";
import { loadCurrentIndex } from "./settingsService.js";

export async function getHomeState() {

    const words = await loadDictionary();

    const totalWords = words.length;

    const currentIndex = await loadCurrentIndex();

    return {

        hasDictionary: totalWords > 0,

        totalWords,

        currentIndex

    };

}

export async function hasDictionary() {

    const words = await loadDictionary();

    return words.length > 0;

}