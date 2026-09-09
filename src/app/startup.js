/* ==========================================================
   Mu'jam - Application Startup
========================================================== */

import {
    initializeDictionary,
    setCurrentIndex
} from "../services/dictionaryService.js";

import {
    loadCurrentIndex
} from "../services/settingsService.js";

import {
    initializeSyncStatus,
    processSyncQueue,
    pullTombstonesFromFirestore,
    pullWordsFromFirestore,
    pullReviewsFromFirestore
} from "../services/syncService.js";


/* ==========================================================
   Run complete synchronization
========================================================== */

async function runFullSync() {

    console.log(
        "FULL SYNC: starting..."
    );


    try {

        /* --------------------------------------------------
           Step 1
           Upload pending local changes
        -------------------------------------------------- */

        await processSyncQueue();


        /* --------------------------------------------------
           Step 2
           Pull deletions first
        -------------------------------------------------- */

        await pullTombstonesFromFirestore();


        /* --------------------------------------------------
           Step 3
           Pull newer words
        -------------------------------------------------- */

        await pullWordsFromFirestore();


        /* --------------------------------------------------
           Step 4
           Pull newer reviews
        -------------------------------------------------- */

        await pullReviewsFromFirestore();


        console.log(
            "FULL SYNC: completed successfully."
        );

    } catch (error) {

        console.error(
            "FULL SYNC: failed:",
            error
        );

    }

}


/* ==========================================================
   Application startup
========================================================== */

export async function startup() {

    /* ------------------------------------------------------
       Initialize synchronization status
    ------------------------------------------------------ */

    initializeSyncStatus();


    /* ------------------------------------------------------
       Initialize local dictionary
    ------------------------------------------------------ */

    const initialized =
        await initializeDictionary();


    if (!initialized) {

        return false;

    }


    /* ------------------------------------------------------
       Restore saved dictionary position
    ------------------------------------------------------ */

    const currentIndex =
        await loadCurrentIndex();


    setCurrentIndex(
        currentIndex
    );


    console.log(
        "Resuming from word",
        currentIndex
    );


    /* ------------------------------------------------------
       Initial synchronization
       Only attempt it while online
    ------------------------------------------------------ */

    if (navigator.onLine) {

        await runFullSync();

    } else {

        console.log(
            "Device is offline. Synchronization postponed."
        );

    }


    /* ------------------------------------------------------
       Synchronize automatically when connection returns
    ------------------------------------------------------ */

    window.addEventListener(
        "online",
        async () => {

            console.log(
                "Internet connection restored."
            );


            await runFullSync();

        }
    );


    return true;

}