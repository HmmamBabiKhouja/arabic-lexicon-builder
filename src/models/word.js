/**
 * Word model
 */

export class Word {

    constructor(id, word, frequency = 0) {

        this.id = id;
        this.word = word;
        this.frequency = frequency;

        this.status = "pending";

        categories = []

        this.notes = "";

        this.createdAt = new Date();

        this.updatedAt = new Date();

    }

}