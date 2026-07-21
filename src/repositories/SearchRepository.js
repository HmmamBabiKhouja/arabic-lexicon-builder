import { openDatabase } from "../database/db.js";

const STORE_NAME = "words";

export async function searchWords(query, limit = 50) {

    const database = await openDatabase();

    return new Promise((resolve, reject) => {

        const tx = database.transaction(
            STORE_NAME,
            "readonly"
        );

        const store = tx.objectStore(STORE_NAME);

        const request = store.getAll();

        request.onsuccess = () => {

            const results =
                request.result
                .filter(word =>
                    word.word.startsWith(query)
                )
                .slice(0, limit);

            resolve(results);

        };

        request.onerror = () => reject(request.error);

    });

}