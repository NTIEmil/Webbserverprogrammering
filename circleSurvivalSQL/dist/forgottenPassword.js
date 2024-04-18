"use strict";
/* När hemsidan har laddats in */
window.onload = function () {
    /* Hämtar elementen */
    let email = document.getElementById("email-frg");
    let messageElement = document.querySelector(".alert-danger");
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get("message");
    if (errorMessage) {
        messageElement.textContent = errorMessage;
    }
    /* Döljer varnignsmeddelandet om det är tomt */
    if (messageElement.textContent == "") {
        messageElement.style.display = "none";
    }
    /* Om användaren försöker skicka formuläret utan att fylla i alla fält så skciaks det
          inte iväg och hen får ett felmeddelande*/
    document
        .getElementById("submit-button")
        .addEventListener("click", function (event) {
        if (email.value == "") {
            event.preventDefault();
            messageElement.textContent = "Fill in your email address";
            messageElement.style.display = "block";
        }
    });
};
