/**
 * Reads a TSV file and returns an array of rows.
 */

export async function parseTSV(file) {

    const text = await file.text();

    const rows = text
        .split(/\r?\n/)
        .filter(line => line.trim() !== "");

        return rows
            .map(row => {
                const parts = row.split("\t");

                if (parts.length !== 2) {
                    return null;
                }

                return {
                    word: parts[0],
                    frequency: Number(parts[1])
                };
            })
            .filter(Boolean);

}