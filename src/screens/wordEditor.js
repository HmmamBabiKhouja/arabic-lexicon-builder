import {
    loadWord,
    saveWord,
    checkDuplicate
} from "../services/wordService.js";

import { categories } from "../config/categories.js";

export async function renderWordEditor(container, wordId) {

    const word = await loadWord(wordId);

    console.log("Word ID:", wordId);
    console.log("Loaded word:", word);

    if (!word) {

        container.innerHTML = `
            <section class="welcome-card">
                <h2>Word not found</h2>
                <button id="backButton">Back</button>
            </section>
        `;

        document
            .getElementById("backButton")
            .addEventListener("click", () => {

                history.back();

            });

        return;
    }

    const categoryHTML = categories
        .map(category => `

            <label>

                <input
                    type="checkbox"
                    value="${category.id}"
                    ${word.categories.includes(category.id) ? "checked" : ""}

                >

                ${category.label}

            </label>

        `)
        .join("");

    container.innerHTML = `

        <section class="welcome-card">

            <h2>Word Editor</h2>

            <p>

                <strong>ID:</strong>
                ${word.id}

            </p>

            <hr>

            <p>

                <strong>Original Word</strong>

            </p>

            <p>

                ${word.originalWord}

            </p>

            <hr>

            <label>

                Current Word

            </label>

            <input
                id="currentWord"
                value="${word.currentWord}"
            >
            <div id="duplicateWarning">
            </div>

            <br><br>

            <h3>

                Categories

            </h3>

            <div class="categories">

                ${categoryHTML}

            </div>

            <br>

            <label>

                Notes

            </label>

            <textarea
                id="notes"
                rows="5"
            >${word.notes}</textarea>

            <br><br>

            <div class="button-group">

                <button id="saveButton">

                    Save

                </button>

                <button id="cancelButton">

                    Cancel

                </button>

            </div>

        </section>

    `;

    const currentWordInput =
    document.getElementById("currentWord");

    currentWordInput.addEventListener(
        "input",
        async () => {

            const duplicate =
                await checkDuplicate(
                    word.id,
                    currentWordInput.value.trim()
                );

            const warning =
                document.getElementById("duplicateWarning");

            if (!duplicate) {

                warning.innerHTML = "";

                return;

            }

            warning.innerHTML = `

                <div class="warning">

                    ⚠ Duplicate found

                    <br>

                    ID: ${duplicate.id}

                    <br>

                    Word: ${duplicate.currentWord}

                </div>

            `;

        }
    );

    document
        .getElementById("saveButton")
        .addEventListener("click", async () => {

            const newWord =
                document
                    .getElementById("currentWord")
                    .value
                    .trim();

            if (!newWord) {

                alert("Word cannot be empty.");

                return;

            }

            word.currentWord = newWord;

            word.notes =
                document
                    .getElementById("notes")
                    .value
                    .trim();

            word.categories = [];

            document
                .querySelectorAll(".categories input:checked")
                .forEach(cb => {

                    word.categories.push(cb.value);

                });

            await saveWord(word);

            window.location.hash = "#/review";

        });

    document
        .getElementById("cancelButton")
        .addEventListener("click", () => {

            history.back();

        });

}