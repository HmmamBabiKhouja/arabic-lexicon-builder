import {
    initializeDictionary,
    setCurrentIndex
} from "../services/dictionaryService.js";

import {
    loadCurrentIndex
} from "../services/settingsService.js";

export async function startup() {

    const hasDictionary =
        await initializeDictionary();

    if (!hasDictionary) {

        return false;

    }

    const currentIndex =
        await loadCurrentIndex();

    setCurrentIndex(currentIndex);

    return true;

}