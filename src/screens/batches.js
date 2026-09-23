import {
    loadBatches,
    generateNextBatch,
    updateBatch,
} from "../services/batchService.js";


function formatStatus(status) {

    switch (status) {

        case "pending":
            return "قيد الانتظار";

        case "in_progress":
            return "قيد المراجعة";

        case "completed":
            return "مكتمل";

        default:
            return status || "غير معروف";
    }
}


function formatStage(stage) {

    if (stage === "first") {
        return "المراجعة الأولى";
    }

    if (stage === "specialist") {
        return "المراجع المختص";
    }

    return stage || "-";
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/**
 * Render Batch Management screen.
 */
export async function renderBatches(container) {

    container.innerHTML = `
        <section class="welcome-card">

            <h2>إدارة دفعات المراجعة</h2>

            <p>
                إنشاء وإدارة دفعات الكلمات بحجم
                <strong>1,000 كلمة</strong>.
            </p>

            <div
                id="batchMessage"
                style="margin: 15px 0;"
            ></div>

            <button
                id="generateBatchButton"
                type="button"
            >
                إنشاء الدفعة التالية
            </button>

        </section>

        <section class="welcome-card">

            <h3>الدفعات</h3>

            <div id="batchesList">
                جاري التحميل...
            </div>

        </section>
    `;


    const message =
        document.getElementById(
            "batchMessage"
        );

    const list =
        document.getElementById(
            "batchesList"
        );

    const generateButton =
        document.getElementById(
            "generateBatchButton"
        );


    async function refreshBatches() {

        const batches =
            await loadBatches();

        if (!batches.length) {

            list.innerHTML = `
                <p>
                    لا توجد دفعات حتى الآن.
                </p>
            `;

            return;
        }


        batches.sort((a, b) =>
            String(a.id).localeCompare(
                String(b.id)
            )
        );


        list.innerHTML = batches
            .map(batch => {

                const total =
                    Number(
                        batch.totalWords || 0
                    );

                const reviewed =
                    Number(
                        batch.reviewedWords || 0
                    );

                const progress =
                    total > 0
                        ? Math.round(
                            (reviewed / total) * 100
                        )
                        : 0;

                return `
                    <article
                        style="
                            border: 1px solid #ddd;
                            padding: 15px;
                            margin-top: 12px;
                            border-radius: 10px;
                        "
                    >

                        <h4>
                            ${escapeHtml(batch.id)}
                        </h4>

                        <p>
                            المرحلة:
                            <strong>
                                ${escapeHtml(
                                    formatStage(
                                        batch.stage
                                    )
                                )}
                            </strong>
                        </p>

                        <div style="margin-top: 12px;">

                            <label>
                                <strong>المراجع:</strong>
                            </label>

                            <br>

                            <input
                                type="text"
                                class="reviewer-input"
                                data-batch-id="${escapeHtml(batch.id)}"
                                value="${escapeHtml(
                                    batch.reviewerId || ""
                                )}"
                                placeholder="مثال: reviewer-001"
                                autocomplete="off"
                            >

                            <button
                                type="button"
                                class="assign-reviewer-button"
                                data-batch-id="${escapeHtml(batch.id)}"
                                style="margin-top: 8px;"
                            >
                                حفظ المراجع
                            </button>

                        </div>                        

                        <p>
                            الحالة:
                            <strong>
                                ${escapeHtml(
                                    formatStatus(
                                        batch.status
                                    )
                                )}
                            </strong>
                        </p>

                        <p>
                            الكلمات:
                            <strong>
                                ${total}
                            </strong>
                        </p>

                        <p>
                            تمت مراجعتها:
                            <strong>
                                ${reviewed}
                            </strong>
                            / ${total}
                        </p>

                        <p>
                            التقدم:
                            <strong>
                                ${progress}%
                            </strong>
                        </p>

                    </article>
                `;
            })
            .join("");
    }


    generateButton.addEventListener(
        "click",
        async () => {

            generateButton.disabled = true;

            message.textContent =
                "جارٍ إنشاء الدفعة...";

            try {

                const batch =
                    await generateNextBatch({
                        batchSize: 1000,
                        stage: "first",
                        reviewerId: null
                    });


                if (!batch) {

                    message.textContent =
                        "لا توجد كلمات أخرى لإنشاء دفعة.";

                } else {

                    message.textContent =
                        `تم إنشاء ${batch.id} بنجاح.`;

                }

                await refreshBatches();

                list.addEventListener(
                    "click",
                    async event => {

                        const button =
                            event.target.closest(
                                ".assign-reviewer-button"
                            );

                        if (!button) {
                            return;
                        }

                        const batchId =
                            button.dataset.batchId;

                        const input =
                            list.querySelector(
                                `.reviewer-input[data-batch-id="${batchId}"]`
                            );

                        if (!input) {
                            return;
                        }

                        const batch =
                            await loadBatch(batchId);

                        if (!batch) {
                            message.textContent =
                                "الدفعة غير موجودة.";

                            return;
                        }

                        batch.reviewerId =
                            input.value.trim() || null;

                        await updateBatch(batch);

                        message.textContent =
                            `تم حفظ المراجع للدفعة ${batchId}.`;

                        await refreshBatches();
                    }
                );

            } catch (error) {

                console.error(
                    "BATCH GENERATION FAILED:",
                    error
                );

                message.textContent =
                    "حدث خطأ أثناء إنشاء الدفعة.";

            } finally {

                generateButton.disabled = false;
            }
        }
    );


    await refreshBatches();
}