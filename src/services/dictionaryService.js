import { Word } from "../models/Word.js";

let words = [];
let currentIndex = 0;

export function setWords(newWords) {
    words = newWords;
    currentIndex = 0;
}

export function getCurrentWord() {
    return words[currentIndex] ?? null;
}

export function nextWord() {
    if (currentIndex < words.length) {
        currentIndex++;
    }

    return getCurrentWord();
}

export function getCurrentIndex() {
    return Math.min(currentIndex + 1, words.length);
}

export function getTotalWords() {
    return words.length;
}

export function saveCategories(wordId, categories) {

    const word = words.find(w => w.id === wordId);

    if (!word) return;

    word.categories = [...categories];
    word.updatedAt = new Date();
}

export function resetReview() {
    currentIndex = 0;
}

export function hasWords() {

    return words.length > 0;

}