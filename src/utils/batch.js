/**
 * Splits an array into batches.
 */

export function createBatches(array, size) {

    const batches = [];

    for (let i = 0; i < array.length; i += size) {

        batches.push(
            array.slice(i, i + size)
        );

    }

    return batches;

}