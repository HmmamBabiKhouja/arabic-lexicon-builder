/**
 * Reads a TSV file and returns an array of rows.
 */

export async function parseTSV(file) {

    const text = await file.text();

    const rows = text
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

    return rows.map(row => {

        const [word, frequency] = row.split("\t");

        return {
            word,
            frequency: Number(frequency)
        };

    });

}