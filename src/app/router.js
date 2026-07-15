import { renderHomeScreen } from "../screens/home.js";
import { renderReviewScreen } from "../screens/review.js";

export function initRouter() {
    window.addEventListener("hashchange", render);
    render();
}

function render() {
    const app = document.getElementById("app");
    const route = window.location.hash || "#/";

    console.log("Current route:", route);

    switch (route) {
        case "#/review":
            console.log("Rendering review screen");
            renderReviewScreen(app);
            break;

        default:
            console.log("Rendering home screen");
            renderHomeScreen(app);
    }
}