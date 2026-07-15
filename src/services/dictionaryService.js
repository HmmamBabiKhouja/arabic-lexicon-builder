import { Word } from "../models/Word.js";

/**
 * Temporary in-memory dictionary.
 * Later this will be replaced with IndexedDB.
 */

const words = [
    new Word(1, "كتاب", 16664531),
    new Word(2, "مدرسة", 8500000),
    new Word(3, "ذهب", 6300000),
    new Word(4, "في", 50000000)
];

let currentIndex = 0;

/**
 * Returns the current word.
 */
export function getCurrentWord() {

    if (currentIndex >= words.length) {
        return null;
    }

    return words[currentIndex];
}

/**
 * Move to the next word.
 */
export function nextWord() {

    if (currentIndex < words.length - 1) {
        currentIndex++;
    }

    return getCurrentWord();
}

/**
 * Restart review.
 */
export function resetReview() {

    currentIndex = 0;

}