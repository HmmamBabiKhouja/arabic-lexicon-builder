            /*
            give the full fill to chatgpt and ask him why there is ifs and swaitch statment 
             */

import { renderHomeScreen } from "../screens/home.js";
import { renderReviewScreen } from "../screens/review.js";
import { renderImportScreen } from "../screens/import.js";
import { renderSearchScreen } from "../screens/search.js";
import { renderWordEditor } from "../screens/wordEditor.js";
import { renderDuplicateScreen } from "../screens/duplicates.js";
import { renderBatches } from "../screens/batches.js";
import { renderBatchReview } from "../screens/batchReview.js";

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

    if (route.startsWith("/batch/")) {

        const batchId =
            decodeURIComponent(
                route.substring(
                    "/batch/".length
                )
            );

        await renderBatchReview(
            container,
            batchId
        );

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

        case "#/batches":

            console.log("Rendering batches screen");

            await renderBatches(app);

            break;    

        default:

            console.log("Rendering home screen");

            await renderHomeScreen(app);

    }

}