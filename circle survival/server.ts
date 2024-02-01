const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");

const dbUrl =
  "mongodb+srv://emilwinroth:cu92LgKFTM6frj8i@cluster0.q7eceeq.mongodb.net/?retryWrites=true&w=majority";

try {
  mongoose.connect(dbUrl);
  console.log("Ansluten till MongoDB");
} catch {
  console.log(Error);
}

let Highscore = mongoose.model("Highscore", {
  name: String,
  score: Number,
});

app.use(express.static("./dist"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/scores", (req, res) => {
  Highscore.find().then((item) => {
    res.send(item);
  });
});

app.post("/scores", (req, res) => {
  let highscore = new Highscore(req.body);

  highscore
    .save()

    .then((item) => {
      io.emit("highscore", req.body);
    })
    .catch((err) => {
      res.status(500).send("unable to save to database");
      console.log(err);
    });
});

io.on("connection", (socket) => {
  console.log("Användare ansluten");
});

http.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});