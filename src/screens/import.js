import { parseTSV } from "../services/tsvParser.js";

export function renderImportScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>استيراد القاموس</h2>

            <input
                type="file"
                id="fileInput"
                accept=".tsv"
            >

            <br><br>

            <button id="importButton">

                استيراد

            </button>

            <br><br>

            <p id="status">

                لم يتم اختيار ملف

            </p>

            <button id="backButton">

                رجوع

            </button>

        </section>

    `;

    registerEvents();

}

function registerEvents() {

    document
        .getElementById("backButton")
        .addEventListener("click", () => {

            window.location.hash = "#/";

        });

    document
        .getElementById("importButton")
        .addEventListener("click", async () => {

            const file =
                document
                .getElementById("fileInput")
                .files[0];

            if (!file) {

                alert("اختر ملف TSV أولاً");

                return;

            }

            const words = await parseTSV(file);

            document
                .getElementById("status")
                .textContent =
                `Imported ${words.length} words`;

            console.log(words.slice(0, 10));

        });

}