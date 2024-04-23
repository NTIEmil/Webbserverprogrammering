/* När hemsidan har laddats in */
window.onload = function () {
  /* Hämtar elementen */
  let password = document.getElementById("password-rst")! as HTMLInputElement;
  let passwordConfirm = document.getElementById(
    "password-conf-rst"
  )! as HTMLInputElement;
  let messageElement = document.querySelector<HTMLElement>(".alert-danger")!;

  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get("message");

  if (errorMessage) {
    messageElement.textContent = errorMessage;
  }

  // Regex för att validera lösenord */
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
      /* Kollar om alla fält är ifyllda */
      if (
        password.value == "" ||
        passwordConfirm.value == ""
      ) {
        messageElement.textContent = "Fill in all fields";
        inputError = true;
        /* Kollar om lösenordet är tillräckligt säkert */
      } else if (password_Regex.test(password.value) == false) {
        messageElement.textContent =
          "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character";
        inputError = true;
        /* Kollar om lösenorden matchar */
      } else if (password.value != passwordConfirm.value) {
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
