import {
    findDuplicateGroups
} from "../repositories/WordRepository.js";


/**
 * Load duplicate groups.
 */
export async function getDuplicateGroups() {

    return await findDuplicateGroups();

}
