/**
 * Home Screen
 */

export function renderHomeScreen(container) {

    container.innerHTML = `
        <section class="welcome-card">

            <h2>معجم</h2>

            <p lang="en">
                Arabic Lexicon Builder
            </p>

            <p class="subtitle">
                Ready to review your dictionary.
            </p>

            <div class="button-group">

                <button
                    type="button"
                    id="startButton">

                    ابدأ المراجعة

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

}