import { loadDictionary } from "../repositories/wordRepository.js";

function isAccepted(word) {
    return word?.status === "reviewed";
}

export function buildAcceptedTsv(words) {

    return words
        .filter(isAccepted)
        .map(word => {

            const text = String(word.currentWord || "")
                .replace(/\t/g, " ")
                .replace(/\r?\n/g, " ");

            const frequency = Number(word.frequency || 0);

            return `${text}\t${frequency}`;

        })
        .join("\n");

}

async function downloadTsv(tsv, filename) {

    const blob = new Blob(
        ["\uFEFF" + tsv],
        { type: "text/tab-separated-values;charset=utf-8" }
    );

    const file = new File(
        [blob],
        filename,
        { type: blob.type }
    );

    if (navigator.share && navigator.canShare?.({ files: [file] })) {

        await navigator.share({
            title: "المعجم المقبول",
            files: [file]
        });

        return;
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);

}

/**
 * Export accepted (reviewed) lexicon words as TSV.
 */
export async function exportAcceptedWords() {

    const words = await loadDictionary();
    const tsv = buildAcceptedTsv(words);

    if (!tsv) {
        throw new Error("NO_ACCEPTED_WORDS");
    }

    const date = new Date().toISOString().slice(0, 10);

    await downloadTsv(
        tsv,
        `mujam-accepted-${date}.tsv`
    );

    return tsv.split("\n").length;

}
