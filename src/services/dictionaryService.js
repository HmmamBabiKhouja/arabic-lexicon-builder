import { loadDictionary } from "../repositories/wordRepository.js";
import { saveWord } from "./wordService.js";
import { saveReview } from "./reviewService.js";
import { saveCurrentIndex } from "./settingsService.js";
import {
    getWordsState,
    setWordsState,
    getIndexState,
    setIndexState,
    upsertWordInMemory,
    removeWordFromMemory
} from "./dictionaryState.js";

export { upsertWordInMemory, removeWordFromMemory };

export function setWords(newWords) {
    setWordsState(newWords);
    setIndexState(0);
}

export function getCurrentWord() {
    return getWordsState()[getIndexState()] ?? null;
}

export function nextWord() {
    const words = getWordsState();
    let currentIndex = getIndexState();

    if (currentIndex < words.length) {
        currentIndex++;
        setIndexState(currentIndex);
    }

    return getCurrentWord();
}

export function previousWord() {
    let currentIndex = getIndexState();

    if (currentIndex > 0) {
        currentIndex--;
        setIndexState(currentIndex);
    }

    return getCurrentWord();
}

export function getCurrentIndex() {
    const words = getWordsState();
    return Math.min(getIndexState() + 1, words.length);
}

export function setCurrentIndex(index) {
    const words = getWordsState();

    if (words.length === 0 || index < 0) {
        setIndexState(0);
        return;
    }

    if (index > words.length) {
        setIndexState(words.length);
        return;
    }

    setIndexState(index);
}

export function getTotalWords() {
    return getWordsState().length;
}

export function saveCategories(wordId, categories) {

    const word = getWordsState().find(
        w => String(w.id) === String(wordId)
    );

    if (!word) return;

    word.categories = [...categories];
    word.updatedAt = new Date();
}

export async function persistReviewPosition() {

    await saveCurrentIndex(getIndexState());

}

/**
 * Persist categories and review outcome, then move forward.
 */
export async function completeCurrentReview({
    categories = [],
    accepted = true,
    status = "reviewed"
} = {}) {

    const word = getCurrentWord();

    if (!word) {
        return null;
    }

    word.categories = [...categories];
    word.status = status;
    word.updatedAt = new Date();

    await saveWord(word);
    await saveReview(word.id, categories, accepted);

    nextWord();
    await persistReviewPosition();

    return getCurrentWord();

}

export async function skipCurrentWord() {

    nextWord();
    await persistReviewPosition();

    return getCurrentWord();

}

export async function goToPreviousWord() {

    previousWord();
    await persistReviewPosition();

    return getCurrentWord();

}

export function resetReview() {
    setIndexState(0);
}

export function hasWords() {

    return getWordsState().length > 0;

}

export async function initializeDictionary() {

    const loadedWords = await loadDictionary();

    if (!loadedWords.length) {

        return false;

    }

    setWords(loadedWords);

    return true;

}
