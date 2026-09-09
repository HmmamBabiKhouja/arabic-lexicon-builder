import { parseTSV } from "../services/tsvParser.js";
import { Word } from "../models/Word.js";
import { setWords, hasWords } from "../services/dictionaryService.js";
import { saveCurrentIndex } from "../services/settingsService.js";
import { openDatabase } from "../database/db.js";
import { importWords } from "../repositories/WordRepository.js";

export function renderImportScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>استيراد القاموس</h2>

            <p>
                ملف TSV: الكلمة ثم علامة تبويب ثم التكرار.
            </p>

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

            const importButton =
                document.getElementById("importButton");

            const status =
                document.getElementById("status");

            const file = document
                .getElementById("fileInput")
                .files[0];

            if (!file) {

                alert("اختر ملف TSV أولاً");
                return;

            }

            if (hasWords()) {

                const confirmed = confirm(
                    "يوجد قاموس محفوظ بالفعل. الاستيراد سيستبدل الكلمات ذات المعرّفات نفسها. هل تريد المتابعة؟"
                );

                if (!confirmed) {
                    return;
                }

            }

            importButton.disabled = true;
            status.textContent = "جارٍ الاستيراد...";

            try {

                await openDatabase();

                const rows = await parseTSV(file);

                if (!rows.length) {

                    status.textContent =
                        "الملف لا يحتوي على صفوف صالحة.";

                    importButton.disabled = false;
                    return;

                }

                const dictionary = rows.map((row, index) =>
                    new Word(
                        index + 1,
                        row.word,
                        row.frequency
                    )
                );

                await importWords(dictionary);

                setWords(dictionary);

                await saveCurrentIndex(0);

                status.textContent =
                    `تم حفظ ${dictionary.length} كلمة`;

                setTimeout(() => {

                    window.location.hash = "#/review";

                }, 800);

            } catch (error) {

                console.error("Import failed:", error);

                status.textContent =
                    "فشل الاستيراد. تحقق من الملف وحاول مرة أخرى.";

                importButton.disabled = false;

            }

        });

}
