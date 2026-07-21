import {
    search
} from "../services/searchService.js";

export async function renderSearchScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>بحث</h2>

            <input
                id="searchInput"
                placeholder="ابحث..."
            >

            <div id="results"></div>

        </section>

    `;

    const input =
        document.getElementById("searchInput");

    input.addEventListener(
        "input",
        async () => {

            const words =
                await search(input.value);

            document
                .getElementById("results")
                .innerHTML =
                words
                .map(w => `
                    <p>${w.word}</p>
                `)
                .join("");

        }
    );

}