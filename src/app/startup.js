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
    processSyncQueue
} from "../services/syncService.js";


export async function startup() {

    // =====================================
    // Initialize sync status
    // =====================================

    initializeSyncStatus();


    // =====================================
    // Initialize dictionary
    // =====================================

    const initialized =
        await initializeDictionary();

    if (!initialized) {

        return false;

    }


    // =====================================
    // Restore current dictionary position
    // =====================================

    const currentIndex =
        await loadCurrentIndex();

    setCurrentIndex(
        currentIndex
    );


    console.log(
        "Resuming from word",
        currentIndex
    );


    // =====================================
    // Process pending cloud changes
    // =====================================

    try {

        await processSyncQueue();

    } catch (error) {

        console.error(
            "Automatic sync failed:",
            error
        );

    }


    // =====================================
    // Process queue when connection returns
    // =====================================

    window.addEventListener(
        "online",
        async () => {

            console.log(
                "Internet connection restored. " +
                "Processing sync queue..."
            );


        if (navigator.onLine) {

            try {

                await processSyncQueue();

            } catch (error) {

                console.error(
                    "Automatic sync failed:",
                    error
                );

            }

        } else {

            console.log(
                "Device is offline. " +
                "Pending sync will remain queued."
            );

        }

        }
    );


    return true;

}