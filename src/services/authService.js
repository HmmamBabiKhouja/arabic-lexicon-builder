import {
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    signOut,
    onAuthStateChanged
} from "firebase/auth";

import {
    auth,
    googleProvider
} from "./firebaseService.js";


/**
 * Sign in with Google.
 *
 * Popup is convenient on desktop.
 * Redirect is better suited to mobile devices.
 */
export async function signInWithGoogle() {

    if (
        /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        )
    ) {

        await signInWithRedirect(
            auth,
            googleProvider
        );

        return null;

    }


    const result =
        await signInWithPopup(
            auth,
            googleProvider
        );

    return result.user;

}


/**
 * Complete a Google redirect sign-in
 * after the application starts.
 */
export async function handleRedirectResult() {

    return await getRedirectResult(
        auth
    );

}


/**
 * Sign out current user.
 */
export async function logout() {

    await signOut(
        auth
    );

}


/**
 * Listen for authentication changes.
 */
export function onUserChanged(
    callback
) {

    return onAuthStateChanged(
        auth,
        callback
    );

}


/**
 * Get currently signed-in user.
 */
export function getCurrentUser() {

    return auth.currentUser;

}