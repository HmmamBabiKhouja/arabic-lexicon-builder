import {
    searchWords
} from "../services/searchService.js";

import { escapeHtml } from "../utils/escapeHtml.js";


export async function renderSearchScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>🔍 البحث في القاموس</h2>

            <input
                id="searchInput"
                placeholder="اكتب كلمة للبحث..."
                autocomplete="off"
            >

            <button id="searchButton">

                بحث

            </button>

            <br><br>

            <button id="backButton">

                رجوع

            </button>

            <br><br>

            <div id="results"></div>

        </section>

    `;


    const input =
        document.getElementById("searchInput");


    const button =
        document.getElementById("searchButton");


    const results =
        document.getElementById("results");


    let searchToken = 0;
    let debounceTimer = null;


    async function performSearch() {

        const token =
            ++searchToken;


        const query =
            input.value.trim();


        if (!query) {

            results.innerHTML = `

                <p>
                    اكتب كلمة للبحث.
                </p>

            `;

            return;

        }


        results.innerHTML = `

            <p>
                جارٍ البحث...
            </p>

        `;


        try {

            const words =
                await searchWords(query);


            if (token !== searchToken) {
                return;
            }


            if (!words.length) {

                results.innerHTML = `

                    <p>
                        لا توجد نتائج.
                    </p>

                `;

                return;

            }


            results.innerHTML =
                words
                    .map(word => `

                        <div
                            class="result-card"
                            data-id="${escapeHtml(word.id)}"
                        >

                            <strong>

                                ${escapeHtml(word.currentWord)}

                            </strong>

                            <br>

                            الكلمة الأصلية:
                            ${escapeHtml(word.originalWord)}

                            <br>

                            المعرّف:
                            ${escapeHtml(word.id)}

                            <br>

                            التكرار:
                            ${Number(word.frequency || 0).toLocaleString()}

                            <br><br>

                            <button
                                class="editButton"
                                data-id="${escapeHtml(word.id)}"
                            >

                                ✏️ تعديل

                            </button>

                        </div>

                        <hr>

                    `)
                    .join("");


            document
                .querySelectorAll(".editButton")
                .forEach(editButton => {

                    editButton.addEventListener(
                        "click",
                        () => {

                            const id =
                                editButton.dataset.id;


                            window.location.hash =
                                "#/word/" + id;

                        }
                    );

                });


        } catch (error) {

            if (token !== searchToken) {
                return;
            }

            console.error(
                "Search failed:",
                error
            );


            results.innerHTML = `

                <p>
                    حدث خطأ أثناء البحث.
                </p>

            `;

        }

    }


    button.addEventListener(
        "click",
        () => {

            clearTimeout(debounceTimer);
            performSearch();

        }
    );


    document
        .getElementById("backButton")
        ?.addEventListener("click", () => {

            window.location.hash = "#/";

        });


    input.addEventListener(
        "input",
        () => {

            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(
                performSearch,
                200
            );

        }
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                clearTimeout(debounceTimer);
                performSearch();

            }

        }
    );


    input.focus();

}
