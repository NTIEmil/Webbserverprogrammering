const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mysql = require("mysql");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

const db = mysql.createConnection({
  // värden hämtas från .env
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL");
});

app.use(express.static("./dist"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/scores", (req, res) => {
  db.query("SELECT * FROM Highscore", (err, rows) => {
    if (err) throw err;
    res.send(rows);
  });
});

app.post("/scores", (req, res) => {
  const highscore = { Name: req.body.name, Score: req.body.score };
  db.query("INSERT INTO Highscore SET ?", highscore, (err, res) => {
    if (err) throw err;
    console.log("Last insert ID:", res.insertId);
  });
});

app.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});