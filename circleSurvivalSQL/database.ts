const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailSender = require("./emailSender.ts");

// Regex to check if the email adress is in a valid format
const emailRegex = new RegExp(
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
);

// Regex to check if the password is secure enough
const passwordRegex = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
);

// Regex to check if the name contains whitespace characters
const nameRegex = new RegExp(/\s/);

// #########################################################
// ################# Database connection ###################
// #########################################################

// Database credentials
const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Connect to the database
db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Connected to MySQL");
  }
});

// #########################################################
// ######### Internaly used database functions #############
// #########################################################

// Checks if a user exists in the database
// Takes in a column and value to check for
async function checkUserExists(column, value) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT ${column} FROM users WHERE ${column} = ?`,
      [value],
      (error, result) => {
        if (error) {
          reject(error);
        }

        resolve(result.length > 0);
      }
    );
  });
}

// Hashes a password
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(password, 10, function (err, hash) {
      if (err) {
        reject(err);
      } else {
        resolve(hash);
      }
    });
  });
}

// Gets the UserID from the database
// Takes in an attribute and a value to search for
function getUserID(attribute, value) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT UserID FROM users WHERE ?? = ?",
      [attribute, value],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0].UserID);
        }
      }
    );
  });
}

// Adds an account to the database
function addAccountToDB(Username, EmailAdress, Password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(Password, 10, function (err, hash) {
      db.query(
        "INSERT INTO users SET?",
        { Username: Username, EmailAdress: EmailAdress, Password: hash },
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve("User registered");
          }
        }
      );
    });
  });
}

// Generates a JWT token for a user
function generateTokenForUser(EmailAdress) {
  let payload = { EmailAdress: EmailAdress };

  let secret = process.env.JWT_SECRET;

  let token = jwt.sign(payload, secret, { expiresIn: "24h" });

  return token;
}

// #########################################################
// ############# Exported database functions ###############
// #########################################################

// Gets an array of the global highscores
// Returns the highest score for each user
function getGlobalHighscores() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT MAX(highscores.Score) AS Score, users.Username AS Name FROM highscores JOIN users ON highscores.UserID = users.UserID GROUP BY users.UserID",
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      }
    );
  });
}

// Gets an array of the personal highscores for a user
function getPersonalHighscores(UserID) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT highscores.Score AS Score, users.Username AS Name FROM highscores JOIN users ON highscores.UserID = users.UserID WHERE users.UserID = ?",
      [UserID],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      }
    );
  });
}

// Gets an array of the highscores for a user and the users they follow
// Returns the highest score for each user
function getFollowingHighscore(UserID) {
  return new Promise((resolve, reject) => {
    db.query(
      "(SELECT MAX(highscores.Score) AS Score, users.Username AS Name FROM highscores JOIN users ON highscores.UserID = users.UserID WHERE users.UserID = ? GROUP BY users.UserID) UNION (SELECT MAX(highscores.Score) AS Score, users.Username AS Name FROM highscores JOIN users ON highscores.UserID = users.UserID WHERE users.UserID IN (SELECT FollowedUserID FROM follows WHERE FollowingUserID = ?) GROUP BY users.UserID)",
      [UserID, UserID],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      }
    );
  });
}

// Adds a highscore to the database
function addHighscore(UserID, Score) {
  db.query(
    "INSERT INTO highscores (UserID, Score) VALUES (?, ?)",
    [UserID, Score],
    (err, rows) => {
      if (err) throw err;
    }
  );
}

// When a user tries to register a new account
function registerUser(Username, EmailAdress, Password, PasswordConfirm) {
  return new Promise(async (resolve, reject) => {
    // Check if the username is already in use
    if (await checkUserExists("Username", Username)) {
      reject("Username or email adress already in use");
      // Check if the email adress is already in use
    } else if (await checkUserExists("EmailAdress", EmailAdress)) {
      reject("Username or email adress is already in use");
      // Checks if the username contains whitespace characters
    } else if (nameRegex.test(Username) == true) {
      reject("The username can't contain whitespace characters");
      // Checks if the email adress is in a valid format
    } else if (emailRegex.test(EmailAdress) == false) {
      reject("Invalid email address");
      // Checks if the password is secure enough
    } else if (passwordRegex.test(Password) == false) {
      reject(
        "The password needs to be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
      );
      // Checks if the passwords match
    } else if (Password !== PasswordConfirm) {
      reject("The passwords do not match");
    } else {
      await addAccountToDB(Username, EmailAdress, Password);
      resolve(getUserID("EmailAdress", EmailAdress));
    }
  });
}

// When a user tries to log in
function authenticateUser(Username, Password) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Username, Password, UserID, Verified FROM users WHERE Username = ?",
      [Username],
      async (error, result) => {
        if (error) {
          reject("An error occurred");
        }
        // If result.length == 0, the user does not exist
        if (result.length == 0) {
          reject("Incorrect username or password");
        } else {
          // Check if the provided password matches the one in the database
          bcrypt.compare(
            Password,
            result[0].Password,
            function (err, passwordResult) {
              if (passwordResult) {
                let response = {
                  userID: result[0].UserID,
                  verified: result[0].Verified,
                };

                resolve(response);
              } else {
                reject("Wrong username or password");
              }
            }
          );
        }
      }
    );
  });
}

// When a user tries to update their account information
function updateUser(UserID, Username, EmailAdress, Password, PasswordConfirm) {
  return new Promise(async (resolve, reject) => {
    let query = "UPDATE users SET ";
    let params = [];

    // Checks if any of the fields are filled in
    if (Username || EmailAdress || Password || PasswordConfirm) {
      // If the user tries to change their password
      if (Password || PasswordConfirm) {
        // If both password fields are not filled in
        if (Password == "" || PasswordConfirm == "") {
          reject("Fill in both password fields to change password");
          // Checks if the password is secure enough
        } else if (passwordRegex.test(Password) == false) {
          reject(
            "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
          );
          // Checks if the passwords match
        } else if (Password != PasswordConfirm) {
          reject("The passwords do not match");
        } else {
          // Adds the password to the query
          query += "Password = ?, ";
          // Hash the password
          await hashPassword(Password)
            .then((hash) => {
              Password = hash;
            })
            .catch((err) => console.error(err));
          // Adds the password to the parameters
          // @ts-ignore
          params.push(Password);
        }
      }
      // If the user tries to change their email adress
      if (EmailAdress) {
        // Checks if the email adress is in a valid format
        if (emailRegex.test(EmailAdress) == false) {
          reject("Invalid email address");
          // Checks if the email adress is already in use
        } else if (await checkUserExists("EmailAdress", EmailAdress)) {
          reject("This email address is already in use");
        } else {
          // Adds the email adress to the query
          query += "EmailAdress = ?, ";
          // Adds the email adress to the parameters
          // @ts-ignore
          params.push(EmailAdress);
        }
      }
      // If the user tries to change their username
      if (Username) {
        // Checks if the username contains whitespace characters
        if (nameRegex.test(Username) == true) {
          reject("The username can't contain whitespace characters");
          // Checks if the username is already in use
        } else if (await checkUserExists("Username", Username)) {
          reject("This username is already in use");
        } else {
          // Adds the username to the query
          query += "Username = ?, ";
          // Adds the username to the parameters
          // @ts-ignore
          params.push(Username);
        }
      }
    } else {
      // If none of the fields are filled in
      reject("Fill in a field to change information");
    }

    // Remove the last comma and space
    query = query.slice(0, -2);

    // Adds the WHERE clause to the query
    query += " WHERE UserID = ?";

    // Adds the UserID to the parameters
    // @ts-ignore
    params.push(UserID);

    // Update the user's record in the database
    db.query(query, params, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve("User updated");
      }
    });
  });
}

// When a user needs their account information
function getUserInfo(UserID) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Username as name, EmailAdress as email FROM users WHERE UserID = ?",
      [UserID],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      }
    );
  });
}

// When a user is to be sent a verification email
function sendUserVerification(UserID) {
  return new Promise(async (resolve, reject) => {
    let user = await getUserInfo(UserID);

    // Generates a token for the user
    // @ts-ignore
    let token = generateTokenForUser(user[0].email);

    // Creates the URL for the user to verify their email adress
    let url = `http://localhost:3000/verify?token=${token}`;

    // Prepares the email's content
    let subject = "Verify your email address";
    let html = `<p>Click <a href="${url}">here</a> to verify your email address</p>`;

    // Sends the email
    emailSender
      // @ts-ignore
      .sendEmail(user[0].email, subject, html)
      .then((result) => {
        resolve("Email sent");
      })
      .catch((err) => {
        reject(err);
      });
  });
}

// When a user verifies their email adress
function verifyUser(token) {
  return new Promise(async (resolve, reject) => {
    try {
      // Verify the token
      let payload = jwt.verify(token, process.env.JWT_SECRET);

      // Get the email adress from the payload
      let EmailAdress = payload.EmailAdress;

      // Update the user's record in the database
      db.query(
        "UPDATE users SET Verified = 1 WHERE EmailAdress = ?",
        [EmailAdress],
        (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log("User verified");
          }
        }
      );
      // Get the user's ID to log them in
      let UserID = await getUserID("EmailAdress", EmailAdress);
      resolve(UserID);
    } catch (err) {
      reject(err);
    }
  });
}

// When a user deletes their account
function deleteUser(UserID) {
  return new Promise((resolve, reject) => {
    // Delete the user's account
    db.query("DELETE FROM users WHERE UserID = ?", [UserID], (err, result) => {
      if (err) {
        reject(err);
      }
    });
    // Delete the user's highscores
    db.query(
      "DELETE FROM highscores WHERE UserID = ?",
      [UserID],
      (err, result) => {
        if (err) {
          reject(err);
        }
      }
    );
    // Delete the user's follows, both as a follower and as a followed user
    db.query(
      "DELETE FROM follows WHERE FollowingUserID = ? OR FollowedUserID = ?",
      [UserID, UserID],
      (err, result) => {
        if (err) {
          reject(err);
        }
      }
    );
    resolve("User deleted");
  });
}

// When a user has forgotten their password
function forgottenPassword(EmailAdress) {
  return new Promise(async (resolve, reject) => {
    // Check if the user exists
    let userExists = await checkUserExists("EmailAdress", EmailAdress);

    if (userExists) {
      // Generate a token for the user
      let token = generateTokenForUser(EmailAdress);

      // Create the URL for the user to reset their password
      let url = `http://localhost:3000/resetPassword?token=${token}`;

      // Prepare the email's content
      let subject = "Reset your password";
      let html = `<p>Click <a href="${url}">here</a> to reset your password</p>`;

      // Send the email
      emailSender
        .sendEmail(EmailAdress, subject, html)
        .then((result) => {
          resolve("Email sent");
        })
        .catch((err) => {
          reject(err);
        });
    } else {
      reject("No user with that email address exists");
    }
  });
}

// When a user resets their password
function resetPassword(token, Password, PasswordConfirm) {
  return new Promise(async (resolve, reject) => {
    try {
      // Verify the token
      let payload = jwt.verify(token, process.env.JWT_SECRET);

      // Get the user's email address from the payload
      let EmailAdress = payload.EmailAdress;

      // Check if the passwords match
      if (passwordRegex.test(Password) == false) {
        reject(
          "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
        );
      } else if (Password !== PasswordConfirm) {
        reject("The passwords do not match");
      } else {
        // Hash the new password
        bcrypt.hash(Password, 10, function (err, hash) {
          // Update the user's password in the database and verify the account
          // since they have confirmed that they have access to the email address
          db.query(
            "UPDATE users SET Password = ?, Verified = 1 WHERE EmailAdress = ?",
            [hash, EmailAdress],
            async (err, result) => {
              if (err) {
                reject(err);
              } else {
                // Sends back the UserID and that the account is verified
                // This is more secure than just setting it to varified the main server-file
                let response = {
                  userID: await getUserID("EmailAdress", EmailAdress),
                  verified: 1,
                };

                resolve(response);
              }
            }
          );
        });
      }
    } catch (err) {
      reject(err);
    }
  });
}

// When a user tries to follow another user
function followUser(UserID, Username) {
  return new Promise(async (resolve, reject) => {
    // Check if the user exists
    if ((await checkUserExists("Username", Username)) == false) {
      reject("No user with that username exists");
      return;
    }

    // Get the UserID of the user to follow
    let FollowedUserID = await getUserID("Username", Username);

    // Check if the user tries to follow themselves
    if (FollowedUserID == UserID) {
      reject("You can't follow yourself");
      return;
    }

    // Check if the user already follows the user
    db.query(
      "SELECT * FROM follows WHERE FollowingUserID = ? AND FollowedUserID = ?",
      [UserID, FollowedUserID],
      (err, rows) => {
        if (err) {
          reject(err);
        } else if (rows.length > 0) {
          reject("You already follow this user");
        }
      }
    );

    // Follow the user
    db.query(
      "INSERT INTO follows (FollowingUserID, FollowedUserID) VALUES (?, ?)",
      [UserID, FollowedUserID],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve("User followed");
      }
    );
  });
}

// When a user needs to get the users they follow
function getFollowing(UserID) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT users.Username as Name FROM follows JOIN users ON follows.FollowedUserID = users.UserID WHERE follows.FollowingUserID = ?",
      [UserID],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve(rows);
      }
    );
  });
}

// When a user unfollows another user
// This is done using generated buttons in the frontend and are only
// available to the user if they follow the user they want to unfollow
function unfollowUser(UserID, Username) {
  return new Promise(async (resolve, reject) => {
    // Get the UserID of the user to unfollow
    let FollowedUserID = await getUserID("Username", Username);

    // Unfollow the user
    db.query(
      "DELETE FROM follows WHERE FollowingUserID = ? AND FollowedUserID = ?",
      [UserID, FollowedUserID],
      (err, rows) => {
        if (err) {
          reject(err);
        }
        resolve("User unfollowed");
      }
    );
  });
}

// Export the functions
module.exports = {
  getGlobalHighscores,
  getPersonalHighscores,
  getFollowingHighscore,
  addHighscore,
  registerUser,
  authenticateUser,
  updateUser,
  getUserInfo,
  sendUserVerification,
  verifyUser,
  deleteUser,
  forgottenPassword,
  resetPassword,
  followUser,
  getFollowing,
  unfollowUser,
};
