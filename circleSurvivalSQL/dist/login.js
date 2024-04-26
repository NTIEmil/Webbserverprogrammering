"use strict";
// When the page has loaded in
window.onload = function () {
    // Gets the elements
    let name = document.getElementById("name-lgn");
    let password = document.getElementById("password-lgn");
    let messageElement = document.querySelector(".alert-danger");
    // Gets any possible error message from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get("message");
    // If there is an error message it is displayed
    if (errorMessage) {
        messageElement.textContent = errorMessage;
    }
    else {
        messageElement.style.display = "none";
    }
    // Checks the form when the user tries to submit it
    document
        .getElementById("submit-button")
        .addEventListener("click", function (event) {
        // Checks if a field is empty and displays an error message if it is
        if (!name.value || !password.value) {
            event.preventDefault();
            messageElement.textContent = "Fill in all fields";
            messageElement.style.display = "block";
        }
    });
};
