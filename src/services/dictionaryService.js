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
    removeWordFromMemory,
    clampCurrentIndex,
    isReviewFinished,
    setReviewFinished
} from "./dictionaryState.js";

export { upsertWordInMemory, removeWordFromMemory, isReviewFinished };

function isPending(word) {
    return Boolean(word) && (!word.status || word.status === "pending");
}

function findPendingIndex(from, direction, wrap = true, excludeIndex = null) {

    const words = getWordsState();
    const count = words.length;

    if (!count) {
        return -1;
    }

    if (direction > 0) {

        for (let i = from; i < count; i++) {
            if (i !== excludeIndex && isPending(words[i])) {
                return i;
            }
        }

        if (wrap) {
            for (let i = 0; i < from; i++) {
                if (i !== excludeIndex && isPending(words[i])) {
                    return i;
                }
            }
        }

        return -1;

    }

    for (let i = from; i >= 0; i--) {
        if (i !== excludeIndex && isPending(words[i])) {
            return i;
        }
    }

    if (wrap) {
        for (let i = count - 1; i > from; i--) {
            if (i !== excludeIndex && isPending(words[i])) {
                return i;
            }
        }
    }

    return -1;

}

function moveToPending(index) {

    if (index < 0) {
        clampCurrentIndex();
        setReviewFinished(getPendingCount() === 0);
        return null;
    }

    setReviewFinished(false);
    setIndexState(index);
    return getCurrentWord();

}

export function setWords(newWords) {
    setWordsState(newWords);
    setIndexState(0);
    setReviewFinished(false);
}

export function getCurrentWord() {
    return getWordsState()[getIndexState()] ?? null;
}

export function getPendingCount() {
    return getWordsState().filter(isPending).length;
}

export function ensurePendingReviewPosition() {

    const words = getWordsState();

    if (!words.length) {
        setIndexState(0);
        setReviewFinished(true);
        return null;
    }

    const current = getIndexState();
    const pendingIndex = isPending(words[current])
        ? current
        : findPendingIndex(current, 1, true);

    return moveToPending(pendingIndex);

}

export function nextWord() {

    const currentIndex = getIndexState();
    const pendingIndex = findPendingIndex(
        currentIndex + 1,
        1,
        true,
        currentIndex
    );

    return moveToPending(pendingIndex);

}

export function previousWord() {

    const currentIndex = getIndexState();
    const pendingIndex = findPendingIndex(
        currentIndex - 1,
        -1,
        true,
        currentIndex
    );

    if (pendingIndex < 0) {
        setReviewFinished(false);
        return getCurrentWord();
    }

    return moveToPending(pendingIndex);

}

export function getCurrentIndex() {
    const words = getWordsState();
    return Math.min(getIndexState() + 1, words.length);
}

export function setCurrentIndex(index) {
    const words = getWordsState();

    if (words.length === 0 || index < 0) {
        setIndexState(0);
        setReviewFinished(words.length === 0);
        return;
    }

    if (index >= words.length) {
        setIndexState(words.length - 1);
        setReviewFinished(false);
        return;
    }

    setReviewFinished(false);
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
 * Persist categories and review outcome, then move to the next pending word.
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
    setReviewFinished(false);
}

export function resumeReview() {
    setReviewFinished(false);
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
