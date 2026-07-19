import { renderHomeScreen } from "../screens/home.js";
import { renderReviewScreen } from "../screens/review.js";
import { renderImportScreen } from "../screens/import.js";

export function initRouter() {

    window.addEventListener("hashchange", render);

    render();

}

async function render() {

    const app = document.getElementById("app");

    const route = window.location.hash || "#/";

    console.log("Current route:", route);

    switch (route) {

        case "#/review":

            console.log("Rendering review screen");

            await renderReviewScreen(app);

            break;

        case "#/import":

            renderImportScreen(app);

            break;

        default:

            console.log("Rendering home screen");

            renderHomeScreen(app);

    }

}