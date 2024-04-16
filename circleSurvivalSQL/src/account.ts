/* När hemsidan har laddats in */
window.onload = function () {
  /* Hämtar elementen */
  let name = document.getElementById("name-chg")! as HTMLInputElement;
  let email = document.getElementById("email-chg")! as HTMLInputElement;
  let password = document.getElementById("password-chg")! as HTMLInputElement;
  let passwordConfirm = document.getElementById(
    "password-conf-chg"
  )! as HTMLInputElement;
  let messageElement = document.querySelector<HTMLElement>(".alert-danger")!;

  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get("message");

  // Get information about the account and display it in the form
  fetch("/auth/info")
    .then((response) => response.json())
    .then((data) => {
      let userInfo = data;
      name.placeholder = userInfo[0].name;
      email.placeholder = userInfo[0].email;
    })
    .catch((error) => console.error("Error:", error));

  if (errorMessage) {
    messageElement.textContent = errorMessage;
  }

  // Regex för att validera e-postadresser och lösenord */
  const email_Regex = new RegExp(
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  );
  const password_Regex = new RegExp(
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
  );

  /* Döljer varnignsmeddelandet om det är tomt */
  if (messageElement.textContent == "") {
    messageElement.style.display = "none";
  }

  /* Kollar formuläret när anvädneren vill skicka in det */
  document
    .getElementById("submit-button")!
    .addEventListener("click", function (event) {
      let inputError = false;

      /* Kollar om ett fält är ifyllt */
      if (
        name.value != "" ||
        email.value != "" ||
        password.value != "" ||
        passwordConfirm.value != ""
      ) {
        /* Om lösenordet ska ändras */
        if (password.value != "" || passwordConfirm.value != "") {
          /* Bara ett lösenordsfält är ifyllt */
          if (password.value == "" || passwordConfirm.value == "") {
            messageElement.textContent =
              "Fill in both password fields to change password";
            inputError = true;
            /* Kollar om lösenordet är tillräckligt säkert */
          } else if (password_Regex.test(password.value) == false) {
            messageElement.textContent =
              "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character";
            inputError = true;
            console.log("Local password error");
            /* Kollar om lösenorden matchar */
          } else if (password.value != passwordConfirm.value) {
            messageElement.textContent = "The passwords do not match";
            inputError = true;
          }
        }
        if (email.value != "") {
          /* Kollar om e-postadressen är i korrekt format */
          if (email_Regex.test(email.value) == false) {
            messageElement.textContent = "Invalid email address";
            inputError = true;
          }
        }
      } else {
        messageElement.textContent = "Fill in a field to change information";
        inputError = true;
      }
      /* Om något är fel skickas inte formuläret iväg och ett felmeddelande visas */
      if (inputError == true) {
        event.preventDefault();
        messageElement.style.display = "block";
      }
    });
};
