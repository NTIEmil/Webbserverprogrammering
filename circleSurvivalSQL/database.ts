const mysql = require("mysql");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const emailSender = require("./emailSender.ts");

// Regex för att validera e-postadresser och lösenord
const emailRegex = new RegExp(
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
);
const passwordRegex = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
);

const db = mysql.createConnection({
  // värden hämtas från .env
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

// Funktion för att kolla om användaren redan finns i databasen
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

function generateTokenForUser(EmailAdress) {
  let payload = { EmailAdress: EmailAdress };

  let secret = process.env.JWT_SECRET;

  let token = jwt.sign(payload, secret, { expiresIn: "24h" });

  return token;
}

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ansluten till MySQL");
  }
});

function getHighscores() {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT highscores.Score, users.Username AS Name FROM highscores JOIN users ON highscores.UserID = users.UserID",
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        // console.log(rows + " in database.ts");
        resolve(rows);
      }
    );
  });
}

function addHighscore(UserID, Score) {
  db.query(
    "INSERT INTO highscores (UserID, Score) VALUES (?, ?)",
    [UserID, Score],
    (err, rows) => {
      if (err) throw err;
      // console.log(rows);
    }
  );
}

function getUserID(EmailAddress) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT UserID FROM users WHERE EmailAdress = ?",
      [EmailAddress],
      (err, result) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          console.log("UserID found: " + result[0].UserID);
          resolve(result[0].UserID);
        }
      }
    );
  });
}

function addAccountToDB(Username, EmailAdress, Password) {
  return new Promise((resolve, reject) => {
    bcrypt.hash(Password, 10, function (err, hash) {
      db.query(
        "INSERT INTO users SET?",
        { Username: Username, EmailAdress: EmailAdress, Password: hash },
        (err, result) => {
          if (err) {
            console.log(err);
            reject(err);
          } else {
            console.log("User registered");
            resolve("User registered");
          }
        }
      );
    });
  });
}

function registerUser(Username, EmailAdress, Password, PasswordConfirm) {
  return new Promise(async (resolve, reject) => {
    // Kollar om det redan finns en användare med samma namn
    if (await checkUserExists("Username", Username)) {
      reject("This username is already in use");
      // Kollar om det redan finns en användare med samma e-postadress
    } else if (await checkUserExists("EmailAdress", EmailAdress)) {
      reject("This email address is already in use");
      // Kollar om e-postadressen är i korrekt format
    } else if (emailRegex.test(EmailAdress) == false) {
      reject("Invalid email address");
      // Kollar om lösenordet är tillräckligt säkert
    } else if (passwordRegex.test(Password) == false) {
      reject(
        "The password needs to be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number and one special character"
      );
      // Kollar om lösenorden matchar
    } else if (Password !== PasswordConfirm) {
      reject("The passwords do not match");
    } else {
      await addAccountToDB(Username, EmailAdress, Password);
      resolve(getUserID(EmailAdress));
    }
  });
}

function authenticateUser(Username, Password) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Username, Password, UserID, Verified FROM users WHERE Username = ?",
      [Username],
      async (error, result) => {
        if (error) {
          console.log(error);
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
                console.log("User logged in");

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

function updateUser(UserID, Username, EmailAdress, Password, PasswordConfirm) {
  console.log(UserID, Username, EmailAdress, Password, PasswordConfirm);

  return new Promise(async (resolve, reject) => {
    let query = "UPDATE users SET ";
    let params = [];

    /* Kollar om ett fält är ifyllt */
    if (
      Username != "" ||
      EmailAdress != "" ||
      Password != "" ||
      PasswordConfirm != ""
    ) {
      /* Om lösenordet ska ändras */
      if (Password != "" || PasswordConfirm != "") {
        /* Bara ett lösenordsfält är ifyllt */
        if (Password == "" || PasswordConfirm == "") {
          reject("Fill in both password fields to change password");
          /* Kollar om lösenordet är tillräckligt säkert */
        } else if (passwordRegex.test(Password) == false) {
          reject(
            "The password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
          );
          /* Kollar om lösenorden matchar */
        } else if (Password != PasswordConfirm) {
          reject("The passwords do not match");
        } else {
          query += "Password = ?, ";
          await hashPassword(Password)
            .then((hash) => {
              Password = hash;
            })
            .catch((err) => console.error(err));
          // @ts-ignore
          params.push(Password);
        }
      }
      if (EmailAdress != "") {
        /* Kollar om e-postadressen är i korrekt format */
        if (emailRegex.test(EmailAdress) == false) {
          reject("Invalid email address");
        } else if (await checkUserExists("EmailAdress", EmailAdress)) {
          reject("This email address is already in use");
        } else {
          query += "EmailAdress = ?, ";
          // @ts-ignore
          params.push(EmailAdress);
        }
      }
      if (Username != "") {
        if (await checkUserExists("EmailAdress", EmailAdress)) {
          reject("This email address is already in use");
        } else {
          query += "Username = ?, ";
          // @ts-ignore
          params.push(Username);
        }
      }
    } else {
      reject("Fill in a field to change information");
    }

    // Remove the last comma and space
    query = query.slice(0, -2);

    query += " WHERE UserID = ?";
    // @ts-ignore
    params.push(UserID);

    db.query(query, params, (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("Success");
        resolve("User updated");
      }
    });
  });
}

function getUserInfo(UserID) {
  console.log(UserID);
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Username as name, EmailAdress as email FROM users WHERE UserID = ?",
      [UserID],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows);
      }
    );
  });
}

function sendUserVerification(UserID) {
  return new Promise(async (resolve, reject) => {
    let user = await getUserInfo(UserID);

    // @ts-ignore
    let token = generateTokenForUser(user[0].email);

    let url = `http://localhost:3000/verify?token=${token}`;

    let subject = "Verify your email address";
    let html = `<p>Click <a href="${url}">here</a> to verify your email address</p>`;

    emailSender
      // @ts-ignore
      .sendEmail(user[0].email, subject, html)
      .then((result) => {
        console.log(result);
        resolve("Email sent");
      })
      .catch((err) => {
        console.log(err);
        reject(err);
      });
  });
}

function verifyUser(token) {
  return new Promise(async (resolve, reject) => {
    try {
      // Verify the token
      let payload = jwt.verify(token, process.env.JWT_SECRET);

      // Get the user ID from the payload
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
      let UserID = await getUserID(EmailAdress);
      console.log(UserID);
      resolve(UserID);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
}

function deleteUser(UserID) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM users WHERE UserID = ?", [UserID], (err, result) => {
      if (err) {
        console.log(err);
        reject(err);
      } else {
        console.log("User deleted");
        resolve("User deleted");
      }
    });
  });
}

function forgottenPassword(EmailAdress) {
  return new Promise(async (resolve, reject) => {
    let userExists = await checkUserExists("EmailAdress", EmailAdress);

    if (userExists) {
      let token = generateTokenForUser(EmailAdress);

      let url = `http://localhost:3000/resetPassword?token=${token}`;

      let subject = "Reset your password";
      let html = `<p>Click <a href="${url}">here</a> to reset your password</p>`;

      emailSender
        .sendEmail(EmailAdress, subject, html)
        .then((result) => {
          console.log(result);
          resolve("Email sent");
        })
        .catch((err) => {
          console.log(err);
          reject(err);
        });
    } else {
      reject("No user with that email address exists");
    }
  });
}

module.exports = {
  getHighscores,
  addHighscore,
  registerUser,
  authenticateUser,
  updateUser,
  getUserInfo,
  sendUserVerification,
  verifyUser,
  deleteUser,
  forgottenPassword,
};
