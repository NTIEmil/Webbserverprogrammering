/* När hemsidan har laddats in */
window.onload = function () {
  /* Hämtar elementen */
  let name = document.getElementById("name-lgn");
  let password = document.getElementById("password-lgn");
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
      if (name.value == "" || password.value == "") {
        event.preventDefault();
        messageElement.textContent = "Fyll i alla fält";
        messageElement.style.display = "block";
      }
    });
};
