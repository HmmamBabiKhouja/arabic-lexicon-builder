import {
    getCurrentWord,
    nextWord,
    saveCategories,
    getCurrentIndex,
    getTotalWords
} from "../services/dictionaryService.js";

import { categories } from "../config/categories.js";

/**
 * Review Screen
 */
export function renderReviewScreen(container) {

    const currentWord = getCurrentWord();
    const currentIndex = getCurrentIndex();
    const totalWords = getTotalWords();

    const wordText = currentWord
        ? currentWord.word
        : "انتهت المراجعة";

    const categoryHTML = categories
    .map(category => `
        <label>
            <input
                type="checkbox"
                value="${category.id}"
            >
            ${category.label}
        </label>
    `)
    .join("");    

    container.innerHTML = `
        <section class="welcome-card">

            <div class="progress-info">

                <strong>${currentIndex} / ${totalWords}</strong>

            </div>

            <h2>Review</h2>

            <h1 class="word">${wordText}</h1>
            <p class="frequency">
                Frequency:
                ${currentWord ? currentWord.frequency.toLocaleString() : "-"}
            </p>

            <div class="categories">

                ${categoryHTML}

            </div>

            <div class="button-group">

                <button id="nextButton">
                    التالي
                </button>

                <button id="backButton">
                    العودة للرئيسية
                </button>

            </div>

        </section>
    `;

    registerEvents();

}

function registerEvents() {

    document
    .getElementById("nextButton")
    .addEventListener("click", () => {

        const currentWord = getCurrentWord();

        if (!currentWord) {
            return;
        }

        const selectedCategories = [];

        document
            .querySelectorAll(".categories input:checked")
            .forEach(cb => {

                selectedCategories.push(cb.value);

            });

        saveCategories(
            currentWord.id,
            selectedCategories
        );

        nextWord();

        renderReviewScreen(
            document.getElementById("app")
        );

    });

}