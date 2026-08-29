import { getHomeState } from "../services/homeService.js";

export async function renderHomeScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h1>معجم</h1>

            <p>
                منشئ المعجم العربي
            </p>

            <div id="homeContent">

                <p>
                    جارٍ التحميل...
                </p>

            </div>

        </section>

    `;


    const content =
        document.getElementById("homeContent");


    try {

        const state =
            await getHomeState();


        // =====================================
        // لا يوجد قاموس
        // =====================================

        if (!state.hasDictionary) {

            content.innerHTML = `

                <h2>
                    لا يوجد قاموس
                </h2>

                <p>
                    لم تقم باستيراد قاموس بعد.
                </p>

                <br>

                <button id="importButton">

                    استيراد القاموس

                </button>

            `;


            document
                .getElementById("importButton")
                .addEventListener(
                    "click",
                    () => {

                        window.location.hash =
                            "#/import";

                    }
                );


            return;

        }


        // =====================================
        // الإحصائيات
        // =====================================

        const stats =
            state.statistics;


        const percent =
            Number(stats.percent || 0);


        // =====================================
        // الشاشة الرئيسية
        // =====================================

        content.innerHTML = `

            <h2>
                القاموس جاهز
            </h2>


            <!-- الإحصائيات -->

            <section class="statistics">

                <h3>
                    التقدم
                </h3>


                <div class="stat-item">

                    <strong>
                        إجمالي الكلمات
                    </strong>

                    <span>
                        ${stats.total}
                    </span>

                </div>


                <div class="stat-item">

                    <strong>
                        الكلمات التي تمت مراجعتها
                    </strong>

                    <span>
                        ${stats.reviewed}
                    </span>

                </div>


                <div class="stat-item">

                    <strong>
                        الكلمات المتبقية
                    </strong>

                    <span>
                        ${stats.remaining}
                    </span>

                </div>


                <div class="stat-item">

                    <strong>
                        نسبة الإنجاز
                    </strong>

                    <span>
                        ${percent.toFixed(1)}%
                    </span>

                </div>


                <br>


                <!-- شريط التقدم -->

                <div class="progress-container">

                    <div
                        class="progress-bar"
                        style="width: ${percent}%"
                    ></div>

                </div>

            </section>


            <br>


            <!-- الموضع الحالي -->

            <p>

                الموضع الحالي:
                
                <strong>
                    ${state.currentIndex + 1}
                </strong>

                من

                <strong>
                    ${state.totalWords}
                </strong>

            </p>


            <br>


            <!-- الأزرار -->

            <div class="button-group">

                <button id="reviewButton">

                    مراجعة الكلمات

                </button>


                <button id="searchButton">

                    🔍 البحث في القاموس

                </button>

                <button id="duplicatesButton">

                    🔁 إدارة التكرارات

                </button>


                <button id="importButton">

                    استيراد قاموس

                </button>

            </div>

        `;


        // =====================================
        // زر المراجعة
        // =====================================

        document
            .getElementById("reviewButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/review";

                }
            );


        // =====================================
        // زر البحث
        // =====================================

        document
            .getElementById("searchButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/search";

                }
            );

        // =====================================
        // زر التكرارات
        // =====================================

        document
            .getElementById("duplicatesButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/duplicates";

                }
            );

        // =====================================
        // زر الاستيراد
        // =====================================

        document
            .getElementById("importButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/import";

                }
            );


    } catch (error) {

        console.error(
            "Failed to load home state:",
            error
        );


        content.innerHTML = `

            <h2>
                حدث خطأ
            </h2>

            <p>
                تعذر تحميل القاموس.
            </p>

            <p>
                راجع وحدة التحكم في المتصفح لمعرفة تفاصيل الخطأ.
            </p>

        `;

    }

}

