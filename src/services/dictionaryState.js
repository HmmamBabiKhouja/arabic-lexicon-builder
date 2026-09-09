let words = [];
let currentIndex = 0;

export function getWordsState() {
    return words;
}

export function setWordsState(newWords) {
    words = newWords;
}

export function getIndexState() {
    return currentIndex;
}

export function setIndexState(index) {
    currentIndex = index;
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

    if (currentIndex > words.length) {
        currentIndex = words.length;
    }

}
