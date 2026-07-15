import { Word } from "../models/Word.js";

/**
 * Temporary in-memory dictionary.
 * Later this will use IndexedDB.
 */

const words = [

    new Word(1, "كتاب", 16664531),
    new Word(2, "مدرسة", 8500000),
    new Word(3, "ذهب", 6300000),
    new Word(4, "في", 50000000)

];

let currentIndex = 0;

/**
 * Returns the next word.
 */
export function getNextWord() {

    if (currentIndex >= words.length) {
        return null;
    }

    const word = words[currentIndex++];

    return structuredClone(word);

}

/**
 * Restart review.
 * (Useful while developing.)
 */
export function resetReview() {

    currentIndex = 0;

}