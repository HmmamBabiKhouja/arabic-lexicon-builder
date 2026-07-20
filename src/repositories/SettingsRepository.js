import {
    saveSetting,
    getSetting
} from "../database/db.js";

export async function saveValue(key, value) {

    await saveSetting(
        key,
        value
    );

}

export async function loadValue(key) {

    return await getSetting(
        key
    );

}