const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
// Importerar bcryptjs för att kryptera lösenord
const bcrypt = require("bcryptjs");

const app = express();
app.set("view engine", "hbs");
dotenv.config({ path: "./.env" });

// Regex för att validera e-postadresser och lösenord
const email_Regex = new RegExp(
  /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
);
const password_Regex = new RegExp(
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/
);

const publicDir = path.join(__dirname, "./webbsidan");

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

app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ansluten till MySQL");
  }
});

// Använder mallen index.hbs
app.get("/", (req, res) => {
  res.render("index");
});

// Använder mallen register.hbs
app.get("/register", (req, res) => {
  res.render("register");
});

// Använder mallen login.hbs
app.get("/login", (req, res) => {
  res.render("login");
});

// Tar emot poster från registeringsformuläret
// Kollar att informationen stämmer och skickar tillbaka ett meddelande med resultatet
// Alla kollar som görs i webbläsaren gjörs även på servern ifall anvndaren skulle gå förbi webbläsarens kollar
app.post("/auth/register", async (req, res) => {
  const { name, email, password, password_confirm } = req.body;
  // Kollar om det redan finns en användare med samma namn
  if (await checkUserExists("name", name)) {
    return res.render("register", {
      message: "Användarnamnet är upptaget",
    });
  // Kollar om det redan finns en användare med samma e-postadress
  } else if (await checkUserExists("email", email)) {
    return res.render("register", {
      message: "E-postadressen är upptagen",
    });
  // Kollar om e-postadressen är i korrekt format
  } else if (email_Regex.test(email) == false) {
    return res.render("register", {
      message: "Ogiltig e-postadress",
    });
  // Kollar om lösenordet är tillräckligt säkert
  } else if (password_Regex.test(password) == false) {
    return res.render("register", {
      message:
        "Lösenordet måste ha minst 8 tecken, en stor bokstav, en liten bokstav, ett nummer och ett specialtecken.",
    });
  // Kollar om lösenorden matchar
  } else if (password !== password_confirm) {
    return res.render("register", {
      message: "Lösenorden matchar ej",
    });
  } else {
    // Krypterar lösenordet
    bcrypt.hash(password, 10, function (err, hash) {
      // Lägger till användaren i databasen
      db.query(
        "INSERT INTO users SET?",
        { name: name, email: email, password: hash },
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            return res.render("register", {
              message: "Användare registrerad",
            });
          }
        }
      );
    });
  }
});

// Tar emot poster från loginsidan
// Meddelandet som skciaks tillbaka om någonting är fel säger itne längre vad som är fel
// Detta för att inte ge bort information om en sådan användare finns eller inte
app.post("/auth/login", (req, res) => {
  const { name, password } = req.body;

  db.query(
    "SELECT name, password FROM users WHERE name = ?",
    [name],
    async (error, result) => {
      if (error) {
        console.log(error);
      }
      // Om == 0 så finns inte användaren
      if (result.length == 0) {
        return res.render("login", {
          message: "Fel användarnamn eller lösenord",
        });
      } else {
        // Vi kollar om lösenordet som är angivet matchar det i databasen
        bcrypt.compare(password, result[0].password, function (err, result) {
          if (result) {
            return res.render("login", {
              message: "Du är nu inloggad",
            });
          } else {
            return res.render("login", {
              message: "Fel användarnamn eller lösenord",
            });
          }
        });
      }
    }
  );
});

// Körde på 4k här bara för att skilja mig åt
// från server.js vi tidigare kört som använder 3k
app.listen(4000, () => {
  console.log("Servern körs, besök http://localhost:4000");
});
