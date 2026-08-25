import {
    loadWord,
    saveWord,
    checkDuplicate
} from "../services/wordService.js";

import {
    categories
} from "../config/categories.js";


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
    // Editor UI
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
    // Duplicate state
    // =====================================

    let duplicateFound = false;


    // =====================================
    // Duplicate checking
    // =====================================

    async function checkCurrentWord() {

        const currentWord =
            currentWordInput.value.trim();


        duplicateFound = false;


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


        duplicateFound = true;


        warning.innerHTML = `

            <div
                class="warning"
                style="
                    padding: 12px;
                    border: 1px solid #d33;
                    border-radius: 6px;
                    margin-top: 10px;
                "
            >

                ⚠️
                <strong>
                    هذه الكلمة موجودة بالفعل
                </strong>


                <br><br>


                الكلمة الموجودة:

                <strong>
                    ${duplicate.currentWord}
                </strong>


                <br>


                الكلمة الأصلية:

                ${duplicate.originalWord}


                <br>


                المعرّف:

                ${duplicate.id}


                <br><br>


                لا يمكن حفظ الكلمة بهذه الصيغة
                لأنها ستصبح مكررة.

            </div>

        `;

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


            // Check one final time
            const duplicate =
                await checkDuplicate(
                    word.id,
                    newWord
                );


            if (duplicate) {

                alert(

                    `هذه الكلمة موجودة بالفعل:\n\n` +

                    `${duplicate.currentWord}\n\n` +

                    `المعرّف: ${duplicate.id}`

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


            await saveWord(word);


            // =================================
            // Return to editor/review
            // =================================

            history.back();

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
