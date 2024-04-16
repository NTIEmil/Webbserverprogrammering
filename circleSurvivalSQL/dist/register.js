"use strict";
/* När hemsidan har laddats in */
window.onload = function () {
    /* Hämtar elementen */
    let name = document.getElementById("name-reg");
    let email = document.getElementById("email-reg");
    let password = document.getElementById("password-reg");
    let passwordConfirm = document.getElementById("password-conf-reg");
    let messageElement = document.querySelector(".alert-danger");
    const urlParams = new URLSearchParams(window.location.search);
    const errorMessage = urlParams.get("message");
    if (errorMessage) {
        messageElement.textContent = errorMessage;
    }
    // Regex för att validera e-postadresser och lösenord */
    const email_Regex = new RegExp(/^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i);
    const password_Regex = new RegExp(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/);
    /* Döljer varnignsmeddelandet om det är tomt */
    if (messageElement.textContent == "") {
        messageElement.style.display = "none";
    }
    /* Kollar formuläret när anvädneren vill skicka in det */
    document
        .getElementById("submit-button")
        .addEventListener("click", function (event) {
        let inputError = false;
        /* Kollar om alla fält är ifyllda */
        if (name.value == "" ||
            email.value == "" ||
            password.value == "" ||
            passwordConfirm.value == "") {
            messageElement.textContent = "Fill in all fields";
            inputError = true;
            /* Kollar om e-postadressen är i korrekt format */
        }
        else if (email_Regex.test(email.value) == false) {
            messageElement.textContent = "Invalid email address";
            inputError = true;
            /* Kollar om lösenordet är tillräckligt säkert */
        }
        else if (password_Regex.test(password.value) == false) {
            messageElement.textContent =
                "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character";
            inputError = true;
            /* Kollar om lösenorden matchar */
        }
        else if (password.value != passwordConfirm.value) {
            messageElement.textContent = "The passwords do not match";
            inputError = true;
        }
        /* Om något är fel skickas inte formuläret iväg och ett felmeddelande visas */
        if (inputError == true) {
            event.preventDefault();
            messageElement.style.display = "block";
        }
    });
};
