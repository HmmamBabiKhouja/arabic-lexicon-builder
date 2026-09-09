import {
    getCurrentWord,
    getCurrentIndex,
    getTotalWords,
    completeCurrentReview,
    skipCurrentWord,
    goToPreviousWord
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
    const wordCategories = Array.isArray(currentWord.categories)
        ? currentWord.categories
        : [];

    const categoryHTML = categories
        .map(category => `
            <label>

                <input
                    type="checkbox"
                    value="${category.id}"
                    ${wordCategories.includes(category.id) ? "checked" : ""}

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

            <h2>مراجعة الكلمات</h2>

            <h1 class="word">

                ${currentWord.currentWord}

            </h1>

            <p class="frequency">

                التكرار:
                ${Number(currentWord.frequency || 0).toLocaleString()}

            </p>

            <div class="categories">

                ${categoryHTML}

            </div>

            <br>

            <div class="button-group">

                <button id="keepButton">

                    قبول

                </button>

                <button id="rejectButton">

                    استبعاد

                </button>

                <button id="skipButton">

                    تخطي

                </button>

                <button id="previousButton">

                    السابق

                </button>

                <button id="editButton">

                    ✏ تعديل

                </button>

                <button id="backButton">

                    العودة للرئيسية

                </button>

            </div>

        </section>

    `;

    registerEvents();

}

function readSelectedCategories() {

    const selectedCategories = [];

    document
        .querySelectorAll(".categories input:checked")
        .forEach(cb => {

            selectedCategories.push(cb.value);

        });

    return selectedCategories;

}

function setBusy(isBusy) {

    document
        .querySelectorAll(".button-group button")
        .forEach(button => {

            button.disabled = isBusy;

        });

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
        .getElementById("keepButton")
        .addEventListener("click", async () => {

            setBusy(true);

            try {

                await completeCurrentReview({
                    categories: readSelectedCategories(),
                    accepted: true,
                    status: "reviewed"
                });

                await renderReviewScreen(
                    document.getElementById("app")
                );

            } catch (error) {

                console.error("Failed to save review:", error);
                setBusy(false);
                alert("تعذر حفظ المراجعة.");

            }

        });

    document
        .getElementById("rejectButton")
        .addEventListener("click", async () => {

            setBusy(true);

            try {

                await completeCurrentReview({
                    categories: readSelectedCategories(),
                    accepted: false,
                    status: "rejected"
                });

                await renderReviewScreen(
                    document.getElementById("app")
                );

            } catch (error) {

                console.error("Failed to reject word:", error);
                setBusy(false);
                alert("تعذر استبعاد الكلمة.");

            }

        });

    document
        .getElementById("skipButton")
        .addEventListener("click", async () => {

            setBusy(true);

            try {

                await skipCurrentWord();

                await renderReviewScreen(
                    document.getElementById("app")
                );

            } catch (error) {

                console.error("Failed to skip word:", error);
                setBusy(false);

            }

        });

    document
        .getElementById("previousButton")
        .addEventListener("click", async () => {

            setBusy(true);

            try {

                await goToPreviousWord();

                await renderReviewScreen(
                    document.getElementById("app")
                );

            } catch (error) {

                console.error("Failed to go to previous word:", error);
                setBusy(false);

            }

        });

    document
        .getElementById("backButton")
        .addEventListener("click", () => {

            window.location.hash = "#/";

        });

}
