import {
    loadBatch,
    updateBatch
} from "../services/batchService.js";

import {
    loadWord,
    saveWord
} from "../services/wordService.js";

import {
    saveReview,
    getReview
} from "../database/db.js";

import {
    syncReview,
    queueReviewSync
} from "../services/syncService.js";

import { categories } from "../config/categories.js";


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/**
 * Render one Batch review session.
 *
 * URL example:
 * #/batch/BATCH-0001
 */
export async function renderBatchReview(
    container,
    batchId
) {

    const batch =
        await loadBatch(batchId);

    if (!batch) {

        container.innerHTML = `
            <section class="welcome-card">
                <h2>الدفعة غير موجودة</h2>

                <button
                    type="button"
                    id="backToBatches"
                >
                    العودة إلى الدفعات
                </button>
            </section>
        `;

        document
            .getElementById("backToBatches")
            .addEventListener(
                "click",
                () => {
                    window.location.hash = "#/batches";
                }
            );

        return;
    }


    const wordIds =
        Array.isArray(batch.wordIds)
            ? batch.wordIds
            : [];


    if (wordIds.length === 0) {

        container.innerHTML = `
            <section class="welcome-card">
                <h2>الدفعة فارغة</h2>

                <button
                    type="button"
                    id="backToBatches"
                >
                    العودة إلى الدفعات
                </button>
            </section>
        `;

        document
            .getElementById("backToBatches")
            .addEventListener(
                "click",
                () => {
                    window.location.hash = "#/batches";
                }
            );

        return;
    }


    let currentIndex =
        Number(batch.currentIndex || 0);


    if (
        currentIndex < 0 ||
        currentIndex >= wordIds.length
    ) {
        currentIndex = 0;
    }


    container.innerHTML = `
        <section class="welcome-card">

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    gap:10px;
                    flex-wrap:wrap;
                "
            >

                <div>
                    <h2>
                        مراجعة ${escapeHtml(batch.id)}
                    </h2>

                    <p>
                        المرحلة:
                        <strong>
                            ${
                                batch.stage === "first"
                                    ? "المراجعة الأولى"
                                    : escapeHtml(batch.stage)
                            }
                        </strong>
                    </p>

                </div>

                <button
                    type="button"
                    id="backToBatches"
                >
                    ← الدفعات
                </button>

            </div>

            <hr>

            <div id="batchProgress"></div>

            <div
                id="batchWordArea"
                style="margin-top:20px;"
            >
                جاري تحميل الكلمة...
            </div>

        </section>
    `;


    const progress =
        document.getElementById(
            "batchProgress"
        );

    const wordArea =
        document.getElementById(
            "batchWordArea"
        );


    document
        .getElementById("backToBatches")
        .addEventListener(
            "click",
            () => {
                window.location.hash = "#/batches";
            }
        );


    async function saveBatchPosition() {

        batch.currentIndex =
            currentIndex;

        batch.updatedAt =
            new Date();

        await updateBatch(batch);
    }


    async function renderCurrentWord() {

        if (
            currentIndex >= wordIds.length
        ) {

            batch.status =
                "completed";

            batch.currentIndex =
                wordIds.length;

            await updateBatch(batch);

            progress.innerHTML = `
                <strong>
                    اكتملت الدفعة
                </strong>
            `;

            wordArea.innerHTML = `
                <div
                    style="
                        text-align:center;
                        padding:30px 10px;
                    "
                >

                    <h3>
                        تم الانتهاء من مراجعة الدفعة 🎉
                    </h3>

                    <p>
                        ${wordIds.length}
                        كلمة
                    </p>

                    <p>
                        المقبول:
                        <strong>
                            ${batch.acceptedWords || 0}
                        </strong>
                    </p>

                    <p>
                        المرفوض:
                        <strong>
                            ${batch.rejectedWords || 0}
                        </strong>
                    </p>

                    <button
                        type="button"
                        id="finishButton"
                    >
                        العودة إلى الدفعات
                    </button>

                </div>
            `;

            document
                .getElementById("finishButton")
                .addEventListener(
                    "click",
                    () => {
                        window.location.hash =
                            "#/batches";
                    }
                );

            return;
        }


        const wordId =
            wordIds[currentIndex];

        const word =
            await loadWord(wordId);


        if (!word) {

            currentIndex++;

            await saveBatchPosition();

            await renderCurrentWord();

            return;
        }


        const existingReview =
            await getReview(wordId);


        const categoryHTML =
            categories
                .map(category => {

                    const checked =
                        existingReview?.categories
                            ?.includes(category.id)
                            ? "checked"
                            : "";

                    return `
                        <label
                            style="
                                display:inline-flex;
                                align-items:center;
                                gap:6px;
                                margin:5px 10px 5px 0;
                            "
                        >

                            <input
                                type="checkbox"
                                class="category-checkbox"
                                value="${escapeHtml(category.id)}"
                                ${checked}
                            >

                            ${escapeHtml(category.label)}

                        </label>
                    `;
                })
                .join("");


        progress.innerHTML = `
            <div>
                الكلمة
                <strong>
                    ${currentIndex + 1}
                </strong>
                من
                <strong>
                    ${wordIds.length}
                </strong>
            </div>

            <div>
                تمت المراجعة:
                <strong>
                    ${batch.reviewedWords || 0}
                </strong>
            </div>
        `;


        wordArea.innerHTML = `
            <div>

                <p>
                    <strong>
                        الكلمة الأصلية:
                    </strong>
                </p>

                <h1
                    style="
                        font-size:2.4rem;
                        margin:10px 0 25px;
                    "
                >
                    ${escapeHtml(word.originalWord)}
                </h1>


                <p>
                    <strong>
                        الكلمة الحالية:
                    </strong>
                </p>

                <input
                    id="currentWord"
                    type="text"
                    value="${escapeHtml(word.currentWord)}"
                    autocomplete="off"
                    style="
                        width:100%;
                        box-sizing:border-box;
                        font-size:1.4rem;
                        padding:10px;
                    "
                >


                <h3 style="margin-top:25px;">
                    التصنيفات
                </h3>

                <div>
                    ${categoryHTML}
                </div>


                <h3 style="margin-top:25px;">
                    الملاحظات
                </h3>

                <textarea
                    id="reviewNotes"
                    rows="5"
                    style="
                        width:100%;
                        box-sizing:border-box;
                    "
                >${escapeHtml(
                    existingReview?.notes || ""
                )}</textarea>


                <div
                    style="
                        display:flex;
                        gap:10px;
                        flex-wrap:wrap;
                        margin-top:20px;
                    "
                >

                    <button
                        type="button"
                        id="rejectButton"
                    >
                        رفض
                    </button>

                    <button
                        type="button"
                        id="acceptButton"
                    >
                        قبول
                    </button>

                </div>

            </div>
        `;


        async function submitReview(
            accepted
        ) {

            const currentWordInput =
                document.getElementById(
                    "currentWord"
                );

            const notesInput =
                document.getElementById(
                    "reviewNotes"
                );


            const selectedCategories =
                Array.from(
                    document.querySelectorAll(
                        ".category-checkbox:checked"
                    )
                )
                .map(
                    checkbox =>
                        checkbox.value
                );


            /*
             * Save edited word.
             */
            if (
                currentWordInput.value.trim() !==
                word.currentWord
            ) {

                word.currentWord =
                    currentWordInput.value.trim();

                await saveWord(word);
            }


            const review = {

                wordId: word.id,

                stage:
                    batch.stage,

                categories:
                    selectedCategories,

                notes:
                    notesInput.value.trim(),

                accepted,

                reviewerId:
                    batch.reviewerId || null,

                batchId:
                    batch.id,

                updatedAt:
                    new Date()
            };


            await saveReview(review);

            await queueReviewSync(review);


            /*
             * Update batch counters.
             *
             * This assumes each word in a batch is
             * reviewed once during the normal workflow.
             */
            batch.reviewedWords =
                Number(batch.reviewedWords || 0) + 1;


            if (accepted) {

                batch.acceptedWords =
                    Number(
                        batch.acceptedWords || 0
                    ) + 1;

            } else {

                batch.rejectedWords =
                    Number(
                        batch.rejectedWords || 0
                    ) + 1;
            }


            currentIndex++;

            batch.currentIndex =
                currentIndex;


            batch.status =
                currentIndex >= wordIds.length
                    ? "completed"
                    : "in_progress";


            await updateBatch(batch);


            await renderCurrentWord();
        }


        document
            .getElementById("acceptButton")
            .addEventListener(
                "click",
                () => submitReview(true)
            );


        document
            .getElementById("rejectButton")
            .addEventListener(
                "click",
                () => submitReview(false)
            );
    }


    await renderCurrentWord();
}