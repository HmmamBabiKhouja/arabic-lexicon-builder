import { renderHomeScreen } from "../screens/home.js";
import { renderReviewScreen } from "../screens/review.js";

export function initRouter() {

    window.addEventListener("hashchange", render);

    render();

}

function render() {

    const app = document.getElementById("app");

    const route = window.location.hash || "#/";

    switch (route) {

        case "#/review":

            renderReviewScreen(app);

            break;

        default:

            renderHomeScreen(app);

    }

}