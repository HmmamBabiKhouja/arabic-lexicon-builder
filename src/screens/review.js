import {
    getCurrentWord,
    nextWord
} from "../services/dictionaryService.js";

/**
 * Review Screen
 */
export function renderReviewScreen(container) {

    const currentWord = getCurrentWord();

    const wordText = currentWord
        ? currentWord.word
        : "انتهت المراجعة";

    container.innerHTML = `
        <section class="welcome-card">

            <h2>Review</h2>

            <h1 class="word">${wordText}</h1>

            <div class="categories">

                <label><input type="checkbox"> اسم</label>

                <label><input type="checkbox"> فعل</label>

                <label><input type="checkbox"> حرف</label>

                <label><input type="checkbox"> ضمير</label>

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