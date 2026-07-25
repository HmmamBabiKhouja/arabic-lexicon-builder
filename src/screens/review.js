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
export async function renderReviewScreen(container) {

    const currentWord = getCurrentWord();

    if (!currentWord) {

        container.innerHTML = `
            <section class="welcome-card">

                <h2>تمت مراجعة جميع الكلمات 🎉</h2>

                <button id="backButton">
                    العودة للرئيسية
                </button>

            </section>
        `;

        document
            .getElementById("backButton")
            .addEventListener("click", () => {

                window.location.hash = "#/";

            });

        return;
    }

    const currentIndex = getCurrentIndex();
    const totalWords = getTotalWords();

    const categoryHTML = categories
        .map(category => `
            <label>

                <input
                    type="checkbox"
                    value="${category.id}"
                    ${currentWord.categories.includes(category.id) ? "checked" : ""}

                >

                ${category.label}

            </label>
        `)
        .join("");

    container.innerHTML = `

        <section class="welcome-card">

            <div class="progress-info">

                <strong>

                    ${currentIndex} / ${totalWords}

                </strong>

            </div>

            <h2>Review</h2>

            <h1 class="word">

                ${currentWord.currentWord}

            </h1>

            <p class="frequency">

                Frequency:
                ${currentWord.frequency.toLocaleString()}

            </p>

            <div class="categories">

                ${categoryHTML}

            </div>

            <br>

            <div class="button-group">

                <button id="editButton">

                    ✏ Edit

                </button>

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
        .getElementById("editButton")
        ?.addEventListener("click", () => {

            const currentWord = getCurrentWord();

            window.location.hash =
                "#/word/" + currentWord.id;

        });

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

    document
        .getElementById("backButton")
        .addEventListener("click", () => {

            window.location.hash = "#/";

        });

}