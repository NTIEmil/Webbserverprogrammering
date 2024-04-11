const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const session = require("express-session");

const database = require("./database.ts");

const publicDir = path.join(__dirname, "./dist");

app.use(
  "/socket.io",
  express.static(
    path.join(__dirname, "node_modules", "socket.io", "dist")
  )
);

app.use(
  session({
    secret: "your secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());

app.get("/scores", (req, res) => {
  database.getHighscores()
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/scores", (req, res) => {
  let { name, score } = req.body;
  database.addHighscore(name, score);
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/login.html"));
});

app.get("/index.html", (req, res) => {
  res.redirect("/");
});

app.get("/", (req, res) => {
  if (req.session.userID) {
    res.sendFile(path.join(__dirname, "dist/index.html"));
    console.log(req.session.userID);
  } else {
    res.redirect("/login");
  }
});

app.use(express.static(publicDir));

// Tar emot poster från registeringsformuläret
// Kollar att informationen stämmer och skickar tillbaka ett meddelande med resultatet
// Alla kollar som görs i webbläsaren gjörs även på servern ifall anvndaren skulle gå förbi webbläsarens kollar
app.post("/auth/register", async (req, res) => {
  let { name, email, password, password_confirm } = req.body;
  database
    .registerUser(name, email, password, password_confirm)
    .then((message) => {
      console.log(message);
      res.redirect("/");
    })
    .catch((errorMessage) => {
      console.log(errorMessage);
      res.redirect("/register?message=" + encodeURIComponent(errorMessage));
    });
});

// Tar emot poster från loginsidan
// Meddelandet som skciaks tillbaka om någonting är fel säger itne längre vad som är fel
// Detta för att inte ge bort information om en sådan användare finns eller inte
app.post("/auth/login", (req, res) => {
  let { name, password } = req.body;
  database
    .authenticateUser(name, password)
    .then((userID) => {
      console.log(userID);
      req.session.userID = userID;
      res.redirect("/");
    })
    .catch((errorMessage) => {
      console.log(errorMessage);
      res.redirect("/login?message=" + encodeURIComponent(errorMessage));
    });
});

// Kollar när en användare har anslutit
io.on("connection", (socket) => {
  console.log("Användare ansluten");
});

http.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});