import {
    searchWords
} from "../services/searchService.js";

export async function renderSearchScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>🔍 Search Dictionary</h2>

            <input
                id="searchInput"
                placeholder="Search..."
            >

            <button id="searchButton">

                Search

            </button>

            <br><br>

            <div id="results"></div>

        </section>

    `;

    const input =
        document.getElementById("searchInput");

    const button =
        document.getElementById("searchButton");

    async function performSearch() {

        const words =
            await searchWords(
                input.value
            );

        const results =
            document.getElementById("results");

        if (!words.length) {

            results.innerHTML = `

                <p>No results found.</p>

            `;

            return;

        }

        results.innerHTML =
            words
            .map(word => `

                <div class="result-card">

                    <strong>

                        ${word.currentWord}

                    </strong>

                    <br>

                    Original:
                    ${word.originalWord}

                    <br>

                    ID:
                    ${word.id}

                    <br>

                    Frequency:
                    ${word.frequency}

                    <br><br>

                    <button
                        class="editButton"
                        data-id="${word.id}"
                    >

                        Edit

                    </button>

                </div>

                <hr>

            `)
            .join("");

        document
            .querySelectorAll(".editButton")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                window.location.hash =
                    "#/word/" +
                    button.dataset.id;

                    }
                );

            });

    }

    button.addEventListener(
        "click",
        performSearch
    );

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                performSearch();

            }

        }
    );

}