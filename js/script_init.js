/* =========================================================
   SCIENTIFIC PORTFOLIO
   JavaScript principal
   ========================================================= */


document.addEventListener("DOMContentLoaded", function () {

    const button = document.querySelector(".button");

    if (!button) {
        return;
    }

    button.addEventListener("click", function () {

        console.log("Scientific Portfolio loaded.");

    });

});

document.addEventListener("DOMContentLoaded", function () {

    const button = document.querySelector("#explore-button");

    button.addEventListener("click", function () {

        const researchSection = document.querySelector("#research");

        researchSection.scrollIntoView({
            behavior: "smooth"
        });

    });

});
