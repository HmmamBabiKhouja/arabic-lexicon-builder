
import { getDuplicateGroups } from "../services/duplicateService.js";


export async function renderDuplicateScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>
                🔁 إدارة التكرارات
            </h2>

            <p>
                جارٍ البحث عن الكلمات المكررة...
            </p>

            <div id="duplicateResults"></div>

        </section>

    `;


    const resultsContainer =
        document.getElementById(
            "duplicateResults"
        );


    try {

        const duplicateGroups =
            await getDuplicateGroups();


        if (!duplicateGroups.length) {

            resultsContainer.innerHTML = `

                <div class="success-message">

                    ✅

                    لا توجد كلمات مكررة.

                </div>

            `;

            return;

        }


        resultsContainer.innerHTML = `

            <p>

                تم العثور على

                <strong>
                    ${duplicateGroups.length}
                </strong>

                مجموعة مكررة.

            </p>

            <br>

            ${duplicateGroups
                .map((group, index) => `

                    <div
                        class="duplicate-group"
                        style="
                            border: 1px solid #ccc;
                            border-radius: 8px;
                            padding: 15px;
                            margin-bottom: 15px;
                        "
                    >

                        <h3>

                            ${group.searchKey}

                        </h3>


                        <p>

                            عدد السجلات:

                            <strong>
                                ${group.words.length}
                            </strong>

                        </p>


                        ${group.words
                            .map(word => `

                                <div
                                    class="duplicate-word"
                                    style="
                                        padding: 10px;
                                        margin-top: 8px;
                                        border-top: 1px solid #eee;
                                    "
                                >

                                    <strong>

                                        ${word.currentWord}

                                    </strong>


                                    <br>


                                    الكلمة الأصلية:

                                    ${word.originalWord}


                                    <br>


                                    المعرّف:

                                    ${word.id}


                                    <br>


                                    التكرار:

                                    ${Number(
                                        word.frequency || 0
                                    ).toLocaleString()}


                                    <br><br>


                                    <button
                                        class="openWordButton"
                                        data-id="${word.id}"
                                    >

                                        ✏️ فتح الكلمة

                                    </button>

                                </div>

                            `)
                            .join("")}

                    </div>

                `)
                .join("")}

        `;


        document
            .querySelectorAll(
                ".openWordButton"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            button.dataset.id;


                        window.location.hash =
                            "#/word/" + id;

                    }
                );

            });


    } catch (error) {

        console.error(
            "Failed to load duplicate groups:",
            error
        );


        resultsContainer.innerHTML = `

            <div class="error-message">

                ❌

                حدث خطأ أثناء البحث عن
                الكلمات المكررة.

            </div>

        `;

    }

}
