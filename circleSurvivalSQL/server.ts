const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mysql = require("mysql");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: "./.env" });

const publicDir = path.join(__dirname, "./dist");

app.use(express.static(publicDir));
app.use(
  "/socket.io",
  express.static(
    path.join(__dirname, "node_modules", "socket.io", "client-dist")
  )
);

const db = mysql.createConnection({
  // värden hämtas från .env
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

db.connect((error) => {
  if (error) {
    console.log(error);
  } else {
    console.log("Ansluten till MySQL");
  }
});

app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());

app.get("/scores", (req, res) => {
  db.query("SELECT * FROM highscores", (err, rows) => {
    if (err) throw err;
    console.log(rows);
    res.send(rows);
  });
});

app.post("/scores", (req, res) => {
  const highscore = { Name: req.body.Name, Score: req.body.Score };
  console.log(highscore);
  db.query("INSERT INTO highscores SET ?", highscore, (err, res) => {
    if (err) throw err;
    console.log("Senaste ID:", res.insertId);
  });
});

// Kollar när en användare har anslutit
io.on("connection", (socket) => {
  console.log("Användare ansluten");
});

http.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});