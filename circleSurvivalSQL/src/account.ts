// When the page has loaded in
window.onload = function () {
  // Gets the elements
  let name = document.getElementById("name-chg")! as HTMLInputElement;
  let email = document.getElementById("email-chg")! as HTMLInputElement;
  let password = document.getElementById("password-chg")! as HTMLInputElement;
  let passwordConfirm = document.getElementById(
    "password-conf-chg"
  )! as HTMLInputElement;
  let messageElement = document.querySelector<HTMLElement>(".alert-danger")!;
  let followName = document.getElementById("name-flw")! as HTMLInputElement;
  let followingList = document.getElementById("following-list")!;

  // Gets any possible error message from the URL
  const urlParams = new URLSearchParams(window.location.search);
  const errorMessage = urlParams.get("message");

  // If there is an error message it is displayed
  if (errorMessage) {
    messageElement.textContent = errorMessage;
  } else {
    messageElement.style.display = "none";
  }

  // Gets information about the account and display it in the form
  fetch("/auth/info")
    .then((response) => response.json())
    .then((data) => {
      let userInfo = data;
      name.placeholder = userInfo[0].name;
      email.placeholder = userInfo[0].email;
    })
    .catch((error) => console.error("Error:", error));

  // Gets the users that the current user is following and display them in a list
  fetch("/auth/following")
    .then((response) => response.json())
    .then((data) => {
      let following = data;

      // Clears the list
      followingList.innerHTML = "";

      // Adds each user to the list
      // @ts-ignore
      following.forEach((user) => {
        // Creates the list element
        let listItem = document.createElement("li");

        // Creates the label for the name
        let nameLabel = document.createElement("label");
        nameLabel.textContent = user.Name;
        nameLabel.classList.add("pe-3", "d-inline-block");
        listItem.appendChild(nameLabel);

        // Creates the unfollow button
        let unfollowButton = document.createElement("button");
        unfollowButton.textContent = "Unfollow";
        unfollowButton.classList.add("btn", "btn-danger");
        // If the user clicks the unfollow button the user is unfollowed
        unfollowButton.addEventListener("click", () => {
          fetch("/auth/unfollow", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: user.Name }),
          })
            .then(() => {
              window.location.reload();
            })
            .catch((error) => console.error("Error:", error));
        });
        listItem.appendChild(unfollowButton);

        // Adds the list element to the list
        followingList.appendChild(listItem);
      });
    })
    .catch((error) => console.error("Error:", error));

  // Regex for validating the input
  const email_Regex = new RegExp(
    /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  );
  const password_Regex = new RegExp(
    /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
  );
  const name_Regex = new RegExp(/\s/)
  

  // Checks the form when the user tries to change the account information
  document
    .getElementById("submit-button")!
    .addEventListener("click", (event) => {
      let inputError = false;

      // Checks if any field is filled in
      if (
        name.value ||
        email.value ||
        password.value ||
        passwordConfirm.value
      ) {
        // Checks if the name contains whitespace characters
        if (name_Regex.test(name.value) == true) {
          messageElement.textContent = "Name can't contain whitespace characters";
          inputError = true;
        }
        // Checks if any password field is filled in
        else if (password.value || passwordConfirm.value) {
          // Checks if both password fields are filled in
          if (!password.value || !passwordConfirm.value) {
            messageElement.textContent =
              "Fill in both password fields to change password";
            inputError = true;
            // Checks if the password is secure enough
          } else if (password_Regex.test(password.value) == false) {
            messageElement.textContent =
              "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character";
            inputError = true;
            // Checks if the passwords match
          } else if (password.value != passwordConfirm.value) {
            messageElement.textContent = "The passwords do not match";
            inputError = true;
          }
        }
        else if (email.value) {
          // Checks if the email is in a valid format
          if (email_Regex.test(email.value) == false) {
            messageElement.textContent = "Invalid email address";
            inputError = true;
          }
        }
      } else {
        // If no field is filled in
        messageElement.textContent = "Fill in a field to change information";
        inputError = true;
      }
      // If there is an error the form is not submitted and an error message is displayed
      if (inputError == true) {
        event.preventDefault();
        messageElement.style.display = "block";
      }
    });

  // Checks the form when the user tries to follow another user
  document
    .getElementById("follow-button")!
    .addEventListener("click", (event) => {
      let inputError = false;

      // Checks if the field is filled in
      if (!followName.value) {
        messageElement.textContent =
          "Fill in the username of whom you want to follow";
        inputError = true;
        // Checks if the user is trying to follow themselves
      } else if (followName.value == name.placeholder) {
        messageElement.textContent = "You can't follow yourself";
        inputError = true;
      }

      // If there is an error the form is not submitted and an error message is displayed
      if (inputError == true) {
        event.preventDefault();
        messageElement.style.display = "block";
      }
    });

  // When the user clicks the logout button
  document.getElementById("logoutButton")!.addEventListener("click", () => {
    // Logs out the user
    fetch("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          // Redirects the user to the login page
          window.location.href = "/login";
        } else {
          console.error("Logout failed");
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  // When the user clicks the delete account button
  document.getElementById("deleteButton")!.addEventListener("click", () => {
    // Asks the user if they are sure they want to delete their account
    let confirmation = confirm(
      "Are you sure you want to delete your account?\nEverything associated with your account will be deleted.\nThis action can't be undone."
    );
    // Stopps prevents the deletion if the user cancels
    if (!confirmation) {
      return;
    }
    // Deletes the account
    fetch("/auth/deleteAccount", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          // Redirects the user to the login page
          window.location.href = "/login";
        } else {
          console.error("Deletion failed");
        }
      })
      .catch((error) => console.error("Error:", error));
  });
};
