import {
    initializeDictionary,
    setCurrentIndex
} from "../services/dictionaryService.js";

import { loadCurrentIndex } from "../services/settingsService.js";

export async function startup() {

    const initialized =
        await initializeDictionary();

    if (!initialized) {

        return false;

    }

    const currentIndex =
        await loadCurrentIndex();

    setCurrentIndex(currentIndex);

    console.log(
        "Resuming from word",
        currentIndex
    );

    return true;

}