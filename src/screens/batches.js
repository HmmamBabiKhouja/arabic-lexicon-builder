import {
    loadBatches,
    generateNextBatch
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

                        <p>
                            المراجع:
                            <strong>
                                ${escapeHtml(
                                    batch.reviewerId || "-"
                                )}
                            </strong>
                        </p>

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