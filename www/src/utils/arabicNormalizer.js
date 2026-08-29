/**
 * Arabic Normalizer
 * Version 1
 *
 * Conservative normalization.
 * Does NOT normalize hamza forms.
 */

export function normalizeArabic(text) {

    if (text === null || text === undefined) {

        return "";

    }

    return String(text)

        // Remove Arabic diacritics / tashkeel
        .replace(/[\u064B-\u065F\u0670]/g, "")

        // Remove Tatweel ـ
        .replace(/\u0640/g, "")

        // Normalize non-breaking spaces
        .replace(/\u00A0/g, " ")

        // Remove leading/trailing whitespace
        .trim();

}