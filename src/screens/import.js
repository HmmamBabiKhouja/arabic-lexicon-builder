import { parseTSV } from "../services/tsvParser.js";
import { Word } from "../models/Word.js";
import { setWords, hasWords } from "../services/dictionaryService.js";
import { saveCurrentIndex } from "../services/settingsService.js";
import { openDatabase } from "../database/db.js";
import { importWords, loadDictionary } from "../repositories/WordRepository.js";
import { normalizeArabic } from "../utils/arabicNormalizer.js";

export function renderImportScreen(container) {

    container.innerHTML = `

        <section class="welcome-card">

            <h2>استيراد القاموس</h2>

            <p>
                ملف TSV: الكلمة ثم علامة تبويب ثم التكرار.
            </p>

            <p>
                الكلمات الجديدة تُضاف بمعرّفات جديدة. الكلمات الموجودة مسبقاً لا تُستبدل.
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

function nextNumericId(words) {

    let maxId = 0;

    for (const word of words) {

        const numericId = Number(word.id);

        if (Number.isFinite(numericId) && numericId > maxId) {
            maxId = numericId;
        }

    }

    return maxId + 1;

}

function searchKeyOf(word) {

    return word.searchKey || normalizeArabic(word.currentWord || word.originalWord || "");

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
                    "سيتم إضافة الكلمات الجديدة فقط. الكلمات الموجودة مسبقاً لن تُستبدل. هل تريد المتابعة؟"
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

                const existing = await loadDictionary();
                const existingKeys = new Set(
                    existing.map(searchKeyOf).filter(Boolean)
                );

                let nextId = nextNumericId(existing);
                const toAdd = [];
                let skipped = 0;

                for (const row of rows) {

                    const searchKey = normalizeArabic(row.word);

                    if (!searchKey || existingKeys.has(searchKey)) {
                        skipped += 1;
                        continue;
                    }

                    existingKeys.add(searchKey);
                    toAdd.push(
                        new Word(
                            nextId,
                            row.word,
                            row.frequency
                        )
                    );
                    nextId += 1;

                }

                if (toAdd.length) {
                    await importWords(toAdd);
                }

                const dictionary = await loadDictionary();

                setWords(dictionary);
                await saveCurrentIndex(0);

                status.textContent =
                    `تمت إضافة ${toAdd.length} كلمة. تم تخطي ${skipped} مكررة.`;

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
