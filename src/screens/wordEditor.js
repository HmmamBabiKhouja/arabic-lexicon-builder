import {
    loadWord,
    saveWord,
    checkDuplicate,
    mergeWords
} from "../services/wordService.js";

import { categories } from "../config/categories.js";


export async function renderWordEditor(
    container,
    wordId
) {

    const word =
        await loadWord(wordId);


    if (!word) {

        container.innerHTML = `

            <section class="welcome-card">

                <h2>
                    الكلمة غير موجودة
                </h2>

                <button id="backButton">

                    رجوع

                </button>

            </section>

        `;


        document
            .getElementById("backButton")
            .addEventListener(
                "click",
                () => {

                    history.back();

                }
            );


        return;

    }


    // =====================================
    // Categories
    // =====================================

    const categoryHTML =
        categories
            .map(category => `

                <label>

                    <input
                        type="checkbox"
                        value="${category.id}"
                        ${
                            word.categories.includes(
                                category.id
                            )
                                ? "checked"
                                : ""
                        }
                    >

                    ${category.label}

                </label>

            `)
            .join("");


    // =====================================
    // Editor
    // =====================================

    container.innerHTML = `

        <section class="welcome-card">

            <h2>
                ✏️ محرر الكلمة
            </h2>


            <p>

                <strong>
                    المعرّف:
                </strong>

                ${word.id}

            </p>


            <hr>


            <p>

                <strong>
                    الكلمة الأصلية:
                </strong>

            </p>


            <p>
                ${word.originalWord}
            </p>


            <hr>


            <label>

                <strong>
                    الكلمة الحالية
                </strong>

            </label>


            <br><br>


            <input
                id="currentWord"
                value="${word.currentWord}"
                autocomplete="off"
            >


            <div
                id="duplicateWarning"
                style="margin-top: 15px;"
            ></div>


            <br>


            <h3>
                التصنيفات
            </h3>


            <div class="categories">

                ${categoryHTML}

            </div>


            <br>


            <label>

                <strong>
                    الملاحظات
                </strong>

            </label>


            <br>


            <textarea
                id="notes"
                rows="5"
            >${word.notes}</textarea>


            <br><br>


            <div class="button-group">

                <button id="saveButton">

                    💾 حفظ

                </button>


                <button id="cancelButton">

                    إلغاء

                </button>

            </div>

        </section>

    `;


    // =====================================
    // Elements
    // =====================================

    const currentWordInput =
        document.getElementById(
            "currentWord"
        );


    const warning =
        document.getElementById(
            "duplicateWarning"
        );


    const saveButton =
        document.getElementById(
            "saveButton"
        );


    // =====================================
    // Duplicate
    // =====================================

    let currentDuplicate = null;


    async function checkCurrentWord() {

        const currentWord =
            currentWordInput.value.trim();


        currentDuplicate = null;

        warning.innerHTML = "";


        if (!currentWord) {

            return;

        }


        const duplicate =
            await checkDuplicate(
                word.id,
                currentWord
            );


        if (!duplicate) {

            return;

        }


        currentDuplicate =
            duplicate;


        warning.innerHTML = `

            <div
                class="warning"
                style="
                    padding: 15px;
                    border: 1px solid #d33;
                    border-radius: 8px;
                    margin-top: 10px;
                "
            >

                ⚠️

                <strong>
                    هذه الكلمة موجودة بالفعل
                </strong>


                <br><br>


                <strong>
                    الكلمة الموجودة:
                </strong>

                ${duplicate.currentWord}


                <br>


                <strong>
                    الكلمة الأصلية:
                </strong>

                ${duplicate.originalWord}


                <br>


                <strong>
                    المعرّف:
                </strong>

                ${duplicate.id}


                <br><br>


                <button
                    id="mergeButton"
                    type="button"
                >

                    🔀 دمج مع الكلمة الموجودة

                </button>

            `;


        // =================================
        // Merge button
        // =================================

        const mergeButton =
            document.getElementById(
                "mergeButton"
            );


        mergeButton.addEventListener(
            "click",
            async () => {

                if (!currentDuplicate) {

                    return;

                }


                const confirmed =
                    confirm(

                        `هل تريد دمج الكلمة الحالية مع:\n\n` +

                        `${currentDuplicate.currentWord}\n\n` +

                        `سيتم الاحتفاظ بالكلمة الموجودة ` +

                        `وحذف الكلمة الحالية بعد نجاح الدمج.`

                    );


                if (!confirmed) {

                    return;

                }


                mergeButton.disabled = true;

                mergeButton.textContent =
                    "جارٍ الدمج...";


                try {

                    await mergeWords(
                        word,
                        currentDuplicate
                    );


                    alert(
                        "تم دمج الكلمتين بنجاح."
                    );


                    window.location.hash =
                        "#/search";


                } catch (error) {

                    console.error(
                        "Merge failed:",
                        error
                    );


                    mergeButton.disabled = false;

                    mergeButton.textContent =
                        "🔀 دمج مع الكلمة الموجودة";


                    alert(
                        "حدث خطأ أثناء دمج الكلمتين."
                    );

                }

            }
        );

    }


    // =====================================
    // Check while typing
    // =====================================

    currentWordInput.addEventListener(
        "input",
        checkCurrentWord
    );


    // =====================================
    // Save
    // =====================================

    saveButton.addEventListener(
        "click",
        async () => {

            const newWord =
                currentWordInput.value.trim();


            if (!newWord) {

                alert(
                    "لا يمكن أن تكون الكلمة فارغة."
                );

                return;

            }


            // =================================
            // Final duplicate check
            // =================================

            const duplicate =
                await checkDuplicate(
                    word.id,
                    newWord
                );


            if (duplicate) {

                // Show duplicate warning again
                currentDuplicate =
                    duplicate;


                await checkCurrentWord();


                alert(
                    "هذه الكلمة موجودة بالفعل. يمكنك دمجها مع الكلمة الموجودة."
                );


                return;

            }


            // =================================
            // Update word
            // =================================

            word.currentWord =
                newWord;


            word.notes =
                document
                    .getElementById("notes")
                    .value
                    .trim();


            word.categories = [];


            document
                .querySelectorAll(
                    ".categories input:checked"
                )
                .forEach(checkbox => {

                    word.categories.push(
                        checkbox.value
                    );

                });


            try {

                await saveWord(word);


                alert(
                    "تم حفظ الكلمة بنجاح."
                );


                history.back();


            } catch (error) {

                console.error(
                    "Save failed:",
                    error
                );


                alert(
                    "حدث خطأ أثناء حفظ الكلمة."
                );

            }

        }
    );


    // =====================================
    // Cancel
    // =====================================

    document
        .getElementById("cancelButton")
        .addEventListener(
            "click",
            () => {

                history.back();

            }
        );

}
