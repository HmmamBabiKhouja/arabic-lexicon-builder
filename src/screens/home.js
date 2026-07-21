import { getHomeState } from "../services/homeService.js";
import { hasDictionary } from "../services/homeService.js";

export async function renderHomeScreen(container) {

    const state = await getHomeState();
    const dictionaryExists = await hasDictionary();

    console.log("Dictionary exists:", dictionaryExists);

    container.innerHTML = `
        <section class="welcome-card">

            <h2>معجم</h2>

            <p lang="en">
                Arabic Lexicon Builder
            </p>

            <p class="subtitle">
                Ready to review your dictionary.
            </p>

            <div class="progress-card">

                <strong>

                    ${state.currentIndex.toLocaleString()}
                    /
                    ${state.totalWords.toLocaleString()}

                </strong>

            </div>

            <div class="button-group">

                <button
                    type="button"
                    id="startButton">

                    ابدأ المراجعة

                </button>

                <button id="importScreenButton">

                    استيراد ملف

                </button>

                <button
                    type="button"
                    id="statisticsButton">

                    الإحصائيات

                </button>

                <button
                    type="button"
                    id="settingsButton">

                    الإعدادات

                </button>

            </div>

        </section>
    `;

    registerEvents();

}

function registerEvents() {

    document
        .getElementById("startButton")
        .addEventListener("click", () => {

            window.location.hash = "#/review";

        });

    document
        .getElementById("importScreenButton")
        .addEventListener("click", () => {

            window.location.hash = "#/import";

        });



}