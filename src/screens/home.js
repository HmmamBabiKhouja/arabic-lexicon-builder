import { getHomeState } from "../services/homeService.js";
import {
    signInWithGoogle,
    getCurrentUser
} from "../services/authService.js";
import {
    getSyncStatus,
    onSyncStatusChange
} from "../services/syncService.js";
import {
    exportAcceptedWords
} from "../services/exportService.js";


const SYNC_LABELS = {
    idle: "المزامنة جاهزة",
    pending: "توجد تغييرات بانتظار المزامنة",
    syncing: "جارٍ المزامنة...",
    error: "فشل المزامنة"
};

let stopSyncListener = null;


function syncLabel(status) {
    return SYNC_LABELS[status] || SYNC_LABELS.idle;
}


export async function renderHomeScreen(container) {

    const user = getCurrentUser();

    container.innerHTML = `
        
        <button id="googleSignInButton">
        ${user ? "الحساب متصل" : "تسجيل الدخول بحساب Google"}
        </button>


        <section class="welcome-card">

            <h1>معجم</h1>

            <p>
                منشئ المعجم العربي
            </p>

            ${user ? `
                <p>
                    ${user.email || user.displayName || ""}
                </p>
            ` : ""}

            <p
                id="syncStatus"
                class="sync-status"
                data-status="${getSyncStatus()}"
            >
                ${syncLabel(getSyncStatus())}
            </p>

            <div id="homeContent">

                <p>
                    جارٍ التحميل...
                </p>

            </div>

        </section>

    `;

    const googleSignInButton =
    document.getElementById(
        "googleSignInButton"
    );

if (googleSignInButton) {

    if (user) {
        googleSignInButton.disabled = true;
    }

    googleSignInButton.addEventListener(
        "click",
        async () => {

            try {

                googleSignInButton.disabled = true;

                await signInWithGoogle();

            } catch (error) {

                console.error(
                    "Google sign-in failed:",
                    error
                );

                alert(
                    "فشل تسجيل الدخول: " +
                    error.message
                );

                googleSignInButton.disabled = false;

            }

        }
    );

}

    const syncStatus =
        document.getElementById("syncStatus");

    if (stopSyncListener) {
        stopSyncListener();
    }

    stopSyncListener = onSyncStatusChange(status => {

        const statusEl =
            document.getElementById("syncStatus");

        if (!statusEl) {
            return;
        }

        statusEl.dataset.status = status;
        statusEl.textContent = syncLabel(status);

    });


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
                        الكلمات المستبعدة
                    </strong>

                    <span>
                        ${stats.rejected}
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
                    ${Math.min(state.currentIndex + 1, state.totalWords)}
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


                <button id="exportButton">

                    تصدير الكلمات المقبولة

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


        document
            .getElementById("reviewButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/review";

                }
            );


        document
            .getElementById("exportButton")
            .addEventListener(
                "click",
                async () => {

                    const exportButton =
                        document.getElementById("exportButton");

                    exportButton.disabled = true;

                    try {

                        const count =
                            await exportAcceptedWords();

                        alert(
                            `تم تصدير ${count} كلمة مقبولة.`
                        );

                    } catch (error) {

                        if (error.message === "NO_ACCEPTED_WORDS") {

                            alert(
                                "لا توجد كلمات مقبولة للتصدير بعد."
                            );

                        } else {

                            console.error(
                                "Export failed:",
                                error
                            );

                            alert(
                                "تعذر تصدير الملف."
                            );

                        }

                    } finally {

                        exportButton.disabled = false;

                    }

                }
            );


        document
            .getElementById("searchButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/search";

                }
            );


        document
            .getElementById("duplicatesButton")
            .addEventListener(
                "click",
                () => {

                    window.location.hash =
                        "#/duplicates";

                }
            );


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
