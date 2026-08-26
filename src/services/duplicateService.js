import { loadDictionary } from "../repositories/WordRepository.js";


/**
 * Find all duplicate groups.
 *
 * Words are grouped by searchKey.
 * Only groups containing more than one
 * word are returned.
 */
export async function findDuplicateGroups() {

    const words =
        await loadDictionary();


    const groups =
        new Map();


    for (const word of words) {

        const searchKey =
            word.searchKey;


        if (!searchKey) {

            continue;

        }


        if (!groups.has(searchKey)) {

            groups.set(
                searchKey,
                []
            );

        }


        groups
            .get(searchKey)
            .push(word);

    }


    const duplicates = [];


    for (
        const [searchKey, wordsForKey]
        of groups
    ) {

        if (
            wordsForKey.length > 1
        ) {

            duplicates.push({

                searchKey,

                words: wordsForKey

            });

        }

    }


    return duplicates;

}
