import { getHomeState } from "../services/homeService.js";
import { deleteDatabase } from "../database/db.js";
import { appConfig } from "../config/appConfig.js";

/**
 * Home Screen
 */
export async function renderHomeScreen(container) {

    const state = await getHomeState();

    console.log("Home State:", state);

    let mainButton = "";

    if (state.hasDictionary) {

        mainButton = `
            <button id="startButton">
                ▶ متابعة المراجعة
            </button>
        `;

    } else {

        mainButton = `
            <button id="importButton">
                📂 استيراد القاموس
            </button>
        `;

    }

    const searchButton = `
        <button id="searchButton">
            🔍 البحث
        </button>
    `;

    container.innerHTML = `

        <section class="welcome-card">

            <h2>معجم</h2>

            <p>
                Arabic Lexicon Builder
            </p>

            <div class="progress-card">

                <p>
                    <strong>عدد الكلمات:</strong>
                    ${state.totalWords.toLocaleString()}
                </p>

                <p>
                    <strong>آخر موضع:</strong>
                    ${state.currentIndex.toLocaleString()}
                </p>

            </div>

            <br>

            ${mainButton}

            <br><br>

            ${searchButton}

            <br><br>

            ${appConfig.developerMode ? `
                <button id="resetButton">
                    🗑 Reset Database
                </button>
            ` : ""}

        </section>

    `;

    registerEvents(state);

}

/**
 * Register button events
 */
function registerEvents(state) {

    if (state.hasDictionary) {

        document
            .getElementById("startButton")
            ?.addEventListener("click", () => {

                window.location.hash = "#/review";

            });

    } else {

        document
            .getElementById("importButton")
            ?.addEventListener("click", () => {

                window.location.hash = "#/import";

            });

    }

    document
        .getElementById("searchButton")
        ?.addEventListener("click", () => {

            window.location.hash = "#/search";

        });

    document
    .getElementById("resetButton")
    ?.addEventListener("click", async () => {

        const confirmed = confirm(
            "Delete the entire database?"
        );

        if (!confirmed) {

            return;

        }

        await deleteDatabase();

        location.reload();

    });    

}