/**
 * Review Screen
 */

export function renderReviewScreen(container) {

    container.innerHTML = `

    <section class="welcome-card">

        <h2>Review</h2>

        <h1 class="word">
            كتاب
        </h1>

        <div class="categories">

            <label><input type="checkbox"> اسم</label>
            <label><input type="checkbox"> فعل</label>
            <label><input type="checkbox"> حرف</label>
            <label><input type="checkbox"> ضمير</label>

        </div>

        <button id="backButton">

            رجوع

        </button>

    </section>

    `;

    registerEvents();

}

function registerEvents() {

    document
        .getElementById("backButton")
        .addEventListener("click", () => {

            window.location.hash = "#/";

        });

}