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
  express.static(path.join(__dirname, "node_modules", "socket.io", "dist"))
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(express.urlencoded({ extended: "false" }));
app.use(express.json());

app.get("/scores", (req, res) => {
  database
    .getHighscores()
    .then((rows) => {
      console.log(rows);
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/scores", (req, res) => {
  let HighScore = req.body.HighScore;
  console.log("New highscore: " + HighScore);
  console.log("Posting userID: " + req.session.userID);
  database.addHighscore(req.session.userID, HighScore);
});

app.get("/auth/info", (req, res) => {
  database
    .getUserInfo(req.session.userID)
    .then((rows) => {
      console.log(rows);
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

// The pages that the user can visit

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
    if (!req.session.verified) {
      res.redirect("/verification");
    } else {
      res.sendFile(path.join(__dirname, "dist/index.html"));
      console.log("UserID connected:" + req.session.userID);
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/account", (req, res) => {
  if (req.session.userID) {
    console.log("Account: " + req.session.verified);
    if (!req.session.verified) {
      res.redirect("/verification");
    } else {
      res.sendFile(path.join(__dirname, "dist/account.html"));
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/verify", async (req, res) => {
  console.log("verifying email");
  try {
    // Get the token from the URL query parameters
    let token = req.query.token;

    // Verify the user's email address
    req.session.userID = await database.verifyUser(token);
    req.session.verified = true;

    console.log("Verified userID: " + req.session.userID);

    // Redirect the user to the home page
    res.redirect("/");
  } catch (err) {
    // Handle any errors that occurred
    console.error(err);
    res
      .status(500)
      .send("An error occurred while verifying your email address.");
  }
});

app.get("/verification", (req, res) => {
  if (req.session.userID) {
    if (!req.session.verified) {
      database.sendUserVerification(req.session.userID);
      res.sendFile(path.join(__dirname, "dist/verification.html"));
    } else {
      res.redirect("/");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/forgottenPassword", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/forgottenPassword.html"));
});

app.get("/resetPassword", (req, res) => {
  // Get the token from the URL query parameters
  let token = req.query.token;

  // Get users ID from token
  req.session.userID = database.getUserID(token);

  res.sendFile(path.join(__dirname, "dist/resetPassword.html"));
});

app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.sendStatus(500);
    }

    console.log("Logged out");

    res.clearCookie("connect.sid");
    res.sendStatus(200);
  });
});

app.post("/auth/deleteAccount", (req, res) => {
  database.deleteUser(req.session.userID);

  req.session.destroy((err) => {
    if (err) {
      return res.sendStatus(500);
    }

    res.clearCookie("connect.sid");

    res.sendStatus(200);
  });
});

// Tar emot poster från registeringsformuläret
// Kollar att informationen stämmer och skickar tillbaka ett meddelande med resultatet
// Alla kollar som görs i webbläsaren gjörs även på servern ifall anvndaren skulle gå förbi webbläsarens kollar
app.post("/auth/register", async (req, res) => {
  let { name, email, password, password_confirm } = req.body;
  database
    .registerUser(name, email, password, password_confirm)
    .then((userID) => {
      req.session.userID = userID;
      console.log("Registered userID: " + userID);
      res.redirect("/verification");
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
    .then((result) => {
      console.log("Logged in userID: " + result.userID);
      req.session.userID = result.userID;
      req.session.verified = result.verified;
      if (!req.session.verified) {
        res.redirect("/verification");
      } else {
        res.redirect("/");
      }
    })
    .catch((errorMessage) => {
      console.log(errorMessage);
      res.redirect("/login?message=" + encodeURIComponent(errorMessage));
    });
});

app.post("/auth/account", async (req, res) => {
  let { name, email, password, password_confirm } = req.body;
  console.log("Updating account" + name, email, password, password_confirm);
  database
    .updateUser(req.session.userID, name, email, password, password_confirm)
    .then((message) => {
      console.log(message);
      res.redirect("/account");
    })
    .catch((errorMessage) => {
      console.log(errorMessage);
      res.redirect("/account?message=" + encodeURIComponent(errorMessage));
    });
});

app.post("/auth/forgottenPassword", async (req, res) => {
  let { email } = req.body;
  console.log("Forgotten password: " + email);
  database
    .forgottenPassword(email)
    .then((message) => {
      console.log(message);
      res.redirect("/forgottenPassword");
    })
    .catch((errorMessage) => {
      console.log(errorMessage);
      res.redirect(
        "/forgottenPassword?message=" + encodeURIComponent(errorMessage)
      );
    });
});

app.use(express.static(publicDir));

http.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});
