import {
    loadWord,
    saveWord,
    checkDuplicate,
    mergeWords,
    removeWord
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
            .getElementById(
                "backButton"
            )
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
                ✏️ تعديل الكلمة
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
            >${word.notes || ""}</textarea>


            <br><br>


            <!-- =================================
                 Action buttons
            ================================== -->

            <div class="editor-actions">

                <button
                    id="saveButton"
                    type="button"
                >
                    حفظ
                </button>


                <button
                    id="cancelButton"
                    type="button"
                >
                    إلغاء
                </button>


                <button
                    id="deleteButton"
                    type="button"
                >
                    حذف الكلمة
                </button>

            </div>


            <br>


            <div
                id="duplicateSection"
            ></div>

        </section>

    `;


    // =====================================
    // Elements
    // =====================================

    const currentWordInput =
        document.getElementById(
            "currentWord"
        );


    const saveButton =
        document.getElementById(
            "saveButton"
        );


    const cancelButton =
        document.getElementById(
            "cancelButton"
        );


    const deleteButton =
        document.getElementById(
            "deleteButton"
        );


    const duplicateWarning =
        document.getElementById(
            "duplicateWarning"
        );


    let currentDuplicate =
        null;


    // =====================================
    // Duplicate check
    // =====================================

    async function checkCurrentWord() {

        const currentWord =
            currentWordInput.value.trim();


        currentDuplicate =
            await checkDuplicate(
                word.id,
                currentWord
            );


        if (!currentDuplicate) {

            duplicateWarning.innerHTML =
                "";

            return;

        }


        duplicateWarning.innerHTML = `

            <div class="warning-card">

                <strong>
                    الكلمة موجودة مسبقًا
                </strong>

                <p>
                    ${currentDuplicate.currentWord}
                </p>

                <button
                    id="mergeButton"
                    type="button"
                >
                    دمج مع الكلمة الموجودة
                </button>

            </div>

        `;


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
                        `ستبقى الكلمة الموجودة وسيتم حذف الكلمة الحالية بعد نجاح الدمج.`
                    );


                if (!confirmed) {

                    return;

                }


                mergeButton.disabled =
                    true;


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


                    mergeButton.disabled =
                        false;


                    mergeButton.textContent =
                        "دمج مع الكلمة الموجودة";


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

    let duplicateCheckTimer = null;

    currentWordInput.addEventListener(
        "input",
        () => {

            clearTimeout(duplicateCheckTimer);

            duplicateCheckTimer = setTimeout(
                checkCurrentWord,
                300
            );

        }
    );


    // =====================================
    // Initial duplicate check
    // =====================================

    await checkCurrentWord();


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
                    .getElementById(
                        "notes"
                    )
                    .value
                    .trim();


            word.categories = [];


            document
                .querySelectorAll(
                    ".categories input:checked"
                )
                .forEach(
                    checkbox => {

                        word.categories.push(
                            checkbox.value
                        );

                    }
                );


            try {

                await saveWord(
                    word
                );


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
    // Delete
    // =====================================

    deleteButton.addEventListener(
        "click",
        async () => {

            const confirmed =
                confirm(
                    `هل أنت متأكد من حذف الكلمة:\n\n` +
                    `${word.currentWord}\n\n` +
                    `سيتم حذف الكلمة ومراجعتها محليًا، ` +
                    `وسيتم مزامنة الحذف مع Firestore.`
                );


            if (!confirmed) {

                return;

            }


            deleteButton.disabled =
                true;


            saveButton.disabled =
                true;


            cancelButton.disabled =
                true;


            deleteButton.textContent =
                "جارٍ الحذف...";


            try {

                await removeWord(
                    word.id
                );


                alert(
                    "تم حذف الكلمة بنجاح."
                );


                window.location.hash =
                    "#/search";


            } catch (error) {

                console.error(
                    "Delete failed:",
                    error
                );


                deleteButton.disabled =
                    false;


                saveButton.disabled =
                    false;


                cancelButton.disabled =
                    false;


                deleteButton.textContent =
                    "حذف الكلمة";


                alert(
                    "حدث خطأ أثناء حذف الكلمة."
                );

            }

        }
    );


    // =====================================
    // Cancel
    // =====================================

    cancelButton.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}