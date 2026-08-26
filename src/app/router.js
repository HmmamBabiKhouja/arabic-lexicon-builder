import { renderHomeScreen } from "../screens/home.js";
import { renderReviewScreen } from "../screens/review.js";
import { renderImportScreen } from "../screens/import.js";
import { renderSearchScreen } from "../screens/search.js";
import { renderWordEditor } from "../screens/wordEditor.js";
import { renderDuplicateScreen } from "../screens/duplicates.js";

export function initRouter() {

    window.addEventListener("hashchange", render);

    render();

}

async function render() {

    const app = document.getElementById("app");
    const route = window.location.hash || "#/";

    console.log("Current route:", route);

    // Dynamic routes
    if (route.startsWith("#/word/")) {

        const id = Number(route.split("/")[2]);

        console.log("Rendering word editor:", id);

        await renderWordEditor(app, id);

        return;
    }

    // Static routes
    switch (route) {

        case "#/review":

            console.log("Rendering review screen");

            await renderReviewScreen(app);

            break;

        case "#/import":

            console.log("Rendering import screen");

            await renderImportScreen(app);

            break;

        case "#/search":

            console.log("Rendering search screen");

            await renderSearchScreen(app);

            break;

        case "#/duplicates":

            console.log("Rendering duplicates screen");

            await renderDuplicateScreen(app);

            break;

        default:

            console.log("Rendering home screen");

            await renderHomeScreen(app);

    }

}