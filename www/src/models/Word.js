export class Word {

    constructor(id, word, frequency = 0) {

        this.id = id;

        // Original TSV word (never changes)
        this.originalWord = word;

        // Editable lexicon word
        this.currentWord = word;

        // Used for searching & duplicate detection
        this.searchKey = word;

        this.frequency = frequency;

        this.status = "pending";

        this.categories = [];

        this.notes = "";

        this.createdAt = new Date();

        this.updatedAt = new Date();

    }

}