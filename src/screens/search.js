import {
    searchWords
} from "../services/searchService.js";


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

            <div id="results"></div>

        </section>

    `;


    const input =
        document.getElementById("searchInput");


    const button =
        document.getElementById("searchButton");


    const results =
        document.getElementById("results");


    async function performSearch() {

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
                            data-id="${word.id}"
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
                            ${word.frequency}

                            <br><br>

                            <button
                                class="editButton"
                                data-id="${word.id}"
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
        performSearch
    );


    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                performSearch();

            }

        }
    );

}
