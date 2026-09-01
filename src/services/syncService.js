/* ==========================================================
   Mu'jam - Sync Service
   Step 2: Firestore synchronization
========================================================== */

import {
    doc,
    setDoc
} from "firebase/firestore";

import { db } from "./firebaseService.js";


const SYNC_STATUS_KEY = "syncStatus";


/**
 * Sync states:
 *
 * idle      → nothing waiting to sync
 * pending   → local changes waiting to sync
 * syncing   → synchronization in progress
 * error     → synchronization failed
 */

let status = "idle";

const listeners = new Set();


/* ==========================================================
   Sync status
========================================================== */

/**
 * Get current sync status
 */
export function getSyncStatus() {

    return status;

}


/**
 * Change sync status
 */
export function setSyncStatus(newStatus) {

    status = newStatus;

    localStorage.setItem(
        SYNC_STATUS_KEY,
        newStatus
    );

    notifyListeners();

}


/**
 * Subscribe to sync status changes
 */
export function onSyncStatusChange(listener) {

    listeners.add(listener);

    return () => {

        listeners.delete(listener);

    };

}


/**
 * Notify all listeners
 */
function notifyListeners() {

    listeners.forEach(listener => {

        try {

            listener(status);

        } catch (error) {

            console.error(
                "Sync status listener error:",
                error
            );

        }

    });

}


/* ==========================================================
   Status helpers
========================================================== */

/**
 * Mark that local data has changed
 */
export function markSyncPending() {

    setSyncStatus("pending");

}


/**
 * Mark synchronization as started
 */
export function markSyncing() {

    setSyncStatus("syncing");

}


/**
 * Mark synchronization as successfully completed
 */
export function markSyncComplete() {

    setSyncStatus("idle");

}


/**
 * Mark synchronization as failed
 */
export function markSyncError() {

    setSyncStatus("error");

}


/* ==========================================================
   Firestore synchronization
========================================================== */

/**
 * Synchronize one word with Firestore.
 *
 * The local IndexedDB record remains the primary record.
 * Firestore receives a copy of the word.
 */
export async function syncWord(word) {

    if (!word) {

        throw new Error(
            "Cannot synchronize an empty word."
        );

    }


    if (!word.id) {

        throw new Error(
            "Cannot synchronize a word without an ID."
        );

    }


    try {

        markSyncing();


        const wordRef =
            doc(
                db,
                "words",
                String(word.id)
            );


        await setDoc(
            wordRef,
            {
                ...word,

                updatedAt:
                    word.updatedAt instanceof Date
                        ? word.updatedAt.toISOString()
                        : word.updatedAt,

                createdAt:
                    word.createdAt instanceof Date
                        ? word.createdAt.toISOString()
                        : word.createdAt
            },
            {
                merge: true
            }
        );


        markSyncComplete();


        console.log(
            "Word synchronized with Firestore:",
            word.id
        );


        return true;

    } catch (error) {

        console.error(
            "Firestore word sync failed:",
            error
        );


        markSyncError();


        throw error;

    }

}


/* ==========================================================
   Restore saved status
========================================================== */

/**
 * Restore saved status when the app starts
 */
export function initializeSyncStatus() {

    const savedStatus =
        localStorage.getItem(
            SYNC_STATUS_KEY
        );


    if (
        savedStatus === "pending" ||
        savedStatus === "syncing" ||
        savedStatus === "error"
    ) {

        status = savedStatus;

    } else {

        status = "idle";

    }

}