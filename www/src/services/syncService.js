/* ==========================================================
   Mu'jam - Sync Service
   Step 1: Local sync foundation
========================================================== */

const SYNC_STATUS_KEY = "syncStatus";

/**
 * Sync states:
 *
 * idle      → nothing waiting
 * pending   → local changes waiting to sync
 * syncing   → synchronization in progress
 * error     → synchronization failed
 */

let status = "idle";

const listeners = new Set();

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