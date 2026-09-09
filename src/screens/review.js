import {
    getCurrentWord,
    getCurrentIndex,
    getTotalWords,
    getPendingCount,
    completeCurrentReview,
    skipCurrentWord,
    goToPreviousWord,
    isReviewFinished,
    resumeReview,
    ensurePendingReviewPosition
} from "../services/dictionaryService.js";

import { categories } from "../config/categories.js";
import { escapeHtml } from "../utils/escapeHtml.js";

/**
 * Review Screen
 */
export async function renderReviewScreen(container, options = {}) {

    if (!options.resume) {
        ensurePendingReviewPosition();
    } else {
        resumeReview();
    }

    const currentWord = getCurrentWord();

    if (!currentWord || isReviewFinished()) {

        container.innerHTML = `
            <section class="welcome-card review-screen">

                <h2>لا توجد كلمات بانتظار المراجعة 🎉</h2>

                ${currentWord ? `
                    <button id="resumeButton">
                        عرض آخر كلمة
                    </button>
                ` : ""}

                <button id="backButton">
                    العودة للرئيسية
                </button>

            </section>
        `;

        document
            .getElementById("resumeButton")
            ?.addEventListener("click", async () => {

                await renderReviewScreen(container, { resume: true });

            });

        document
            .getElementById("backButton")
            .addEventListener("click", () => {

                window.location.hash = "#/";

            });

        return;
    }

    const currentIndex = getCurrentIndex();
    const totalWords = getTotalWords();
    const pendingCount = getPendingCount();
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

        <section class="welcome-card review-screen">

            <div class="progress-info">

                <strong>
                    المتبقي ${pendingCount}
                </strong>
                <span>
                    ${currentIndex} / ${totalWords}
                </span>

            </div>

            <h1 class="word">

                ${escapeHtml(currentWord.currentWord)}

            </h1>

            <p class="frequency">

                التكرار:
                ${Number(currentWord.frequency || 0).toLocaleString()}

            </p>

            <div class="categories">

                ${categoryHTML}

            </div>

            <div class="review-actions">

                <button id="keepButton" class="review-keep">
                    قبول
                </button>

                <button id="rejectButton" class="review-reject">
                    استبعاد
                </button>

            </div>

            <div class="review-secondary">

                <button id="skipButton" class="ghost-button">
                    تخطي
                </button>

                <button id="previousButton" class="ghost-button">
                    السابق
                </button>

                <button id="editButton" class="ghost-button">
                    تعديل
                </button>

                <button id="backButton" class="ghost-button">
                    الرئيسية
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
        .querySelectorAll(".review-screen button")
        .forEach(button => {

            button.disabled = isBusy;

        });

}

function registerEvents() {

    document
        .getElementById("editButton")
        ?.addEventListener("click", () => {

            const currentWord = getCurrentWord();

            if (!currentWord) {
                return;
            }

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
