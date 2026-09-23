import { openDatabase } from "../database/db.js";

const STORE_NAME = "words";
const INDEX_NAME = "searchKey";

/**
 * Prefix-search words using the IndexedDB searchKey index.
 * Does not scan the full dictionary.
 */
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
            tx.objectStore(
                STORE_NAME
            );


        if (
            !store.indexNames.contains(
                INDEX_NAME
            )
        ) {

            reject(
                new Error(
                    "searchKey index is missing."
                )
            );

            return;

        }


        const index =
            store.index(
                INDEX_NAME
            );


        const range =
            IDBKeyRange.bound(
                query,
                query + "\uffff"
            );


        const request =
            index.getAll(
                range,
                limit
            );


        request.onsuccess = () => {

            resolve(
                request.result ?? []
            );

        };


        request.onerror = () => {

            reject(
                request.error
            );

        };

    });

}
