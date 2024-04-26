"use strict";
// When the page has loaded in
window.onload = function () {
    // Gets the elements
    let password = document.getElementById("password-rst");
    let passwordConfirm = document.getElementById("password-conf-rst");
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
    // Regex for validating the input
    const password_Regex = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/);
    // Checks the form when the user tries to submit it
    document
        .getElementById("submit-button")
        .addEventListener("click", function (event) {
        let inputError = false;
        // Checks if a field is empty
        if (password.value == "" ||
            passwordConfirm.value == "") {
            messageElement.textContent = "Fill in all fields";
            inputError = true;
            // Checks if the password is secure enough
        }
        else if (password_Regex.test(password.value) == false) {
            messageElement.textContent =
                "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character";
            inputError = true;
            // Checks if the passwords match
        }
        else if (password.value != passwordConfirm.value) {
            messageElement.textContent = "The passwords do not match";
            inputError = true;
        }
        // If there is an error the form is not submitted and an error message is displayed
        if (inputError == true) {
            event.preventDefault();
            messageElement.style.display = "block";
        }
    });
};
