let words = [];
let currentIndex = 0;
let reviewFinished = false;

export function getWordsState() {
    return words;
}

export function setWordsState(newWords) {
    words = newWords;
    reviewFinished = false;
}

export function getIndexState() {
    return currentIndex;
}

export function setIndexState(index) {
    currentIndex = index;
}

export function isReviewFinished() {
    return reviewFinished;
}

export function setReviewFinished(finished) {
    reviewFinished = Boolean(finished);
}

/**
 * Keep currentIndex in 0 .. words.length - 1
 * (or 0 when the dictionary is empty).
 */
export function clampCurrentIndex() {

    if (words.length === 0) {
        currentIndex = 0;
        return;
    }

    if (currentIndex < 0) {
        currentIndex = 0;
        return;
    }

    if (currentIndex >= words.length) {
        currentIndex = words.length - 1;
    }

}

export function upsertWordInMemory(word) {

    const index = words.findIndex(
        w => String(w.id) === String(word.id)
    );

    if (index >= 0) {
        words[index] = word;
        return;
    }

    words.push(word);

}

export function removeWordFromMemory(wordId) {

    words = words.filter(
        w => String(w.id) !== String(wordId)
    );

    clampCurrentIndex();

}
