import { getHomeState } from "../services/homeService.js";

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
                متابعة المراجعة
            </button>
        `;

    } else {

        mainButton = `
            <button id="importButton">
                استيراد القاموس
            </button>
        `;

    }

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

        </section>

    `;

    registerEvents(state);

}

/**
 * Register events
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

}