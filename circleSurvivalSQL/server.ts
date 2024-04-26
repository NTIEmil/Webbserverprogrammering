const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const path = require("path");
const session = require("express-session");

const database = require("./database.ts");


// ##############################################################
//                 Setting up the server
// ##############################################################

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

// ##############################################################
//                 Page navigation
// ##############################################################

// The pages that the user can visit

// Pages you can visit without being logged in:

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/login.html"));
});

app.get("/forgottenPassword", (req, res) => {
  res.sendFile(path.join(__dirname, "dist/forgottenPassword.html"));
});

// I have been directed to the index.html page sometimes when just
// typing in the URL. This is a fix for that.
app.get("/index.html", (req, res) => {
  res.redirect("/");
});

// Pages you can visit when logged in and have a verified email address:

// The home page
app.get("/", (req, res) => {
  if (req.session.userID) {
    if (!req.session.verified) {
      res.redirect("/verification");
    } else {
      res.sendFile(path.join(__dirname, "dist/index.html"));
    }
  } else {
    res.redirect("/login");
  }
});

// The account page
app.get("/account", (req, res) => {
  if (req.session.userID) {
    if (!req.session.verified) {
      res.redirect("/verification");
    } else {
      res.sendFile(path.join(__dirname, "dist/account.html"));
    }
  } else {
    res.redirect("/login");
  }
});

// Pages visited via email links:

// Email varification page
// This page verifies the user's email address using
// the token in the URL query parameters
app.get("/verify", async (req, res) => {
  try {
    // Get the token from the URL query parameters
    let token = req.query.token;

    // Verify the user's email address
    req.session.userID = await database.verifyUser(token);
    req.session.verified = true;

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

// Password reset page
app.get("/resetPassword", (req, res) => {
  req.session.token = req.query.token;

  res.sendFile(path.join(__dirname, "dist/resetPassword.html"));
});

// Page you are rediriected to when you have to verify your email:
app.get("/verification", (req, res) => {
  if (req.session.userID) {
    if (!req.session.verified) {
      // Send the user a verification email
      database.sendUserVerification(req.session.userID);
      res.sendFile(path.join(__dirname, "dist/verification.html"));
    } else {
      res.redirect("/");
    }
  } else {
    res.redirect("/login");
  }
});

// ##############################################################
//                 Game-related requests
// ##############################################################

// Getting the global highscores from the database
app.get("/scores/global", (req, res) => {
  database
    .getGlobalHighscores()
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

// Getting the personal highscores from the database
app.get("/scores/personal", (req, res) => {
  database
    .getPersonalHighscores(req.session.userID)
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

// Getting the following highscores from the database
app.get("/scores/following", (req, res) => {
  database
    .getFollowingHighscore(req.session.userID)
    .then((rows) => {
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

// Posting the highscore to the database
app.post("/scores", (req, res) => {
  let HighScore = req.body.HighScore;
  database.addHighscore(req.session.userID, HighScore);
});

// ##############################################################
//                 Account-related post requests
// ##############################################################

// When the user wants to register a new account
app.post("/auth/register", async (req, res) => {
  let { name, email, password, password_confirm } = req.body;
  // Tries to register the user in the database
  database
    .registerUser(name, email, password, password_confirm)
    .then((userID) => {
      // Logs in the user if the registration was successful
      req.session.userID = userID;
      // Sends the user to verify their email
      res.redirect("/verification");
    })
    .catch((errorMessage) => {
      res.redirect("/register?message=" + encodeURIComponent(errorMessage));
    });
});

// When the user wants to log in
app.post("/auth/login", (req, res) => {
  let { name, password } = req.body;
  // Tries to authenticate the user
  database
    .authenticateUser(name, password)
    .then((result) => {
      // Logs in the user if the authentication was successful
      // and stores if the user has verified their email
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

// When the user wants to update their account information
app.post("/auth/account", async (req, res) => {
  let { name, email, password, password_confirm } = req.body;
  // Tries to update the user's information in the database
  database
    .updateUser(req.session.userID, name, email, password, password_confirm)
    .then((message) => {
      res.redirect("/account");
    })
    .catch((errorMessage) => {
      res.redirect("/account?message=" + encodeURIComponent(errorMessage));
    });
});

// When the user wants to log out
app.post("/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.sendStatus(500);
    }

    res.clearCookie("connect.sid");
    res.sendStatus(200);
  });
});

// When the user wants to delete their account
app.post("/auth/deleteAccount", (req, res) => {
  // Deletes the user from the database
  database.deleteUser(req.session.userID);

  // Logs out the user
  req.session.destroy((err) => {
    if (err) {
      return res.sendStatus(500);
    }

    res.clearCookie("connect.sid");
    res.sendStatus(200);
  });
});

// When the user wants to send a password reset email
app.post("/auth/forgottenPassword", async (req, res) => {
  let { email } = req.body;
  // Sends the user a password reset email
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

// When the user wants to reset their password
// using the link from the password reset email
app.post("/auth/resetPassword", async (req, res) => {
  let { password, password_confirm } = req.body;
  // Resets the user's password in the database
  database
    .resetPassword(req.session.token, password, password_confirm)
    .then((result) => {
      // Logs in the user if the password reset was successful
      // and stores if the user has verified their email
      req.session.userID = result.userID;
      req.session.verified = result.verified;
      res.redirect("/");
    })
    .catch((errorMessage) => {
      res.redirect(
        "/resetPassword?message=" + encodeURIComponent(errorMessage)
      );
    });
});

// When the user wants to follow another user
app.post("/auth/follow", async (req, res) => {
  let { name } = req.body;

  // Tries to follow the user using the database
  database
    .followUser(req.session.userID, name)
    .then((message) => {
      res.redirect("/account");
    })
    .catch((errorMessage) => {
      res.redirect("/account?message=" + encodeURIComponent(errorMessage));
    });
});

// When the user wants to unfollow another user
app.post("/auth/unfollow", async (req, res) => {
  let { name } = req.body;

  // Tries to unfollow the user using the database
  database
    .unfollowUser(req.session.userID, name)
    .then((message) => {
      res.redirect("/account");
    })
    .catch((errorMessage) => {
      res.redirect("/account?message=" + encodeURIComponent(errorMessage));
    });
});

// ##############################################################
//                 Account-related get requests
// ##############################################################

// When the user wants to get their account information
app.get("/auth/info", (req, res) => {
  // Gets the user's information from the database
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

// When the user wants to get the users they are following
app.get("/auth/following", (req, res) => {
  // Gets the users the user is following from the database
  database
    .getFollowing(req.session.userID)
    .then((rows) => {
      console.log(rows);
      res.send(rows);
    })
    .catch((err) => {
      console.log(err);
    });
});

// ##############################################################
//                    Initiating the server
// ##############################################################

// Needs to be at the end of the file for all posts and gets to work
app.use(express.static(publicDir));

// Informs that the server is up and running
http.listen(3000, () => {
  console.log("Server is running, visit http://localhost:3000");
});
