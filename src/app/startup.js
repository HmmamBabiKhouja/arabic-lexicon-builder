import {
    initializeDictionary,
    setCurrentIndex
} from "../services/dictionaryService.js";

import {loadCurrentIndex} from "../services/settingsService.js";

import {
    initializeSyncStatus,
    processSyncQueue
} from "../services/syncService.js";

import {
    handleRedirectResult,
    onUserChanged
} from "../services/authService.js";

export async function startup() {

    await handleRedirectResult();

onUserChanged(user => {

    if (user) {

        console.log(
            "Firebase user:",
            user.uid,
            user.email
        );

    } else {

        console.log(
            "No Firebase user signed in."
        );

    }

});

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
    // Listen for internet connection recovery
    // =====================================

    window.addEventListener(
        "online",
        async () => {

            console.log(
                "Internet connection restored. " +
                "Processing sync queue..."
            );


            try {

                await processSyncQueue();

            } catch (error) {

                console.error(
                    "Automatic sync after reconnect failed:",
                    error
                );

            }

        }
    );


    return true;

}