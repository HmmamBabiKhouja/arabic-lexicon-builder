/**
 * ==========================================
 * Mu'jam - Arabic Lexicon Builder
 * app.js
 * Version 0.1
 * ==========================================
 */

import { appConfig } from "../config/appConfig.js";
import { initRouter } from "./router.js";
import { startup } from "./startup.js";

/**
 * Initialize the application.
 */
async function initializeApp() {
    console.log("=================================");
    console.log(`${appConfig.name} v${appConfig.version}`);
    console.log("Initializing...");
    console.log("=================================");

applyTheme();

const initialized = await startup();

console.log(
    initialized
        ? "Dictionary loaded."
        : "No dictionary found."
);

registerEvents();

initRouter();

    console.log("Application Ready");
}

/**
 * Apply the saved theme.
 */
function applyTheme() {

    const theme =
        localStorage.getItem("theme")
        || appConfig.defaultTheme;

    document.body.dataset.theme = theme;
}

/**
 * Register global event listeners.
 */
function registerEvents() {

    const startButton =
        document.getElementById("startButton");

    if (startButton) {

        startButton.addEventListener(
            "click",
            () => {

                window.location.hash = "/review";

            }
        );

    }

}

/**
 * Start the application.
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeApp
);