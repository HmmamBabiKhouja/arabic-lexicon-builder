import {
    saveValue,
    loadValue
} from "../repositories/SettingsRepository.js";

const CURRENT_INDEX = "currentIndex";

export async function saveCurrentIndex(index) {

    console.log("Saving current index:", index);

    await saveValue(
        CURRENT_INDEX,
        index
    );

    console.log("Current index saved.");

}

export async function loadCurrentIndex() {

    const value = await loadValue(
        CURRENT_INDEX
    );

    return value ?? 0;

}