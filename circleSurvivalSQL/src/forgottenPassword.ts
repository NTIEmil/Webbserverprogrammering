// When the page has loaded in
window.onload = function () {
  // Gets the elements
  let email = document.getElementById("email-frg")! as HTMLInputElement;
  let messageElement = document.querySelector<HTMLElement>(".alert-danger")!;

  // Gets any possible error message from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get("message");

  // If there is an error message it is displayed
  if (errorMessage) {
    messageElement.textContent = errorMessage;
  } else {
    messageElement.style.display = "none";
  }

  // Checks the form when the user tries to submit it
  document
    .getElementById("submit-button")!
    .addEventListener("click", function (event) {
      // Checks if the email field is empty and displays an error message if it is
      if (email.value == "") {
        event.preventDefault();
        messageElement.textContent = "Fill in your email address";
        messageElement.style.display = "block";
      }
    });
};
