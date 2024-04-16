const mysql = require("mysql");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

dotenv.config({ path: "./.env" });

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
const checkUserExists = async (column, value) => {
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
};

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
      // Krypterar lösenordet
      bcrypt.hash(Password, 10, function (err, hash) {
        // Lägger till användaren i databasen
        db.query(
          "INSERT INTO users SET?",
          { Username: Username, EmailAdress: EmailAdress, Password: hash },
          (err, result) => {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              console.log("Success");
              resolve("User registered");
            }
          }
        );
      });
    }
  });
}

function authenticateUser(Username, Password) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT Username, Password, UserID FROM users WHERE Username = ?",
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
                resolve(result[0].UserID);
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
      Username != null ||
      EmailAdress != null ||
      Password != null ||
      PasswordConfirm != null
    ) {
      /* Om lösenordet ska ändras */
      if (Password != null || PasswordConfirm != null) {
        /* Bara ett lösenordsfält är ifyllt */
        if (Password == null || PasswordConfirm == null) {
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
          bcrypt.hash(Password, 10, function (err, hash) {
            // @ts-ignore
            params.push(hash);
          });
        }
      }
      if (EmailAdress != null) {
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
      if (Username != null) {
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

module.exports = {
  getHighscores,
  addHighscore,
  registerUser,
  authenticateUser,
  updateUser,
  getUserInfo,
};
