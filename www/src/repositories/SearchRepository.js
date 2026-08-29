import { openDatabase } from "../database/db.js";

const STORE_NAME = "words";


export async function searchWordsFromDatabase(
    query,
    limit = 50
) {

    const database =
        await openDatabase();


    return new Promise((resolve, reject) => {

        const tx =
            database.transaction(
                STORE_NAME,
                "readonly"
            );


        const store =
            tx.objectStore(STORE_NAME);


        const request =
            store.openCursor();


        const results = [];


        request.onsuccess = event => {

            const cursor =
                event.target.result;


            if (!cursor) {

                resolve(results);

                return;

            }


            const word =
                cursor.value;


            const searchKey =
                word.searchKey || "";


            if (
                searchKey.startsWith(query)
            ) {

                results.push(word);

            }


            if (
                results.length >= limit
            ) {

                resolve(results);

                return;

            }


            cursor.continue();

        };


        request.onerror = () => {

            reject(request.error);

        };

    });

}
