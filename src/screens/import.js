import { parseTSV } from "../services/tsvParser.js";
import { Word } from "../models/Word.js";
import { setWords } from "../services/dictionaryService.js";
import { openDatabase } from "../database/db.js";
import { importWords } from "../repositories/WordRepository.js";

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

            await openDatabase();

            const file = document
                .getElementById("fileInput")
                .files[0];

            if (!file) {

                alert("اختر ملف TSV أولاً");
                return;

            }

            const words = await parseTSV(file);

            const dictionary = words.map((row, index) =>
                new Word(
                    index + 1,
                    row.word,
                    row.frequency
                )
            );

            await importWords(dictionary);

            const stored = await getWords();

            setWords(dictionary);

            document
                .getElementById("status")
                .textContent =
                `✅ Saved ${stored.length} words`;

            setTimeout(() => {

                window.location.hash = "#/review";

            }, 1000);

        });

}