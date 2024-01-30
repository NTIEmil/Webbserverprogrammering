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

let Highscore = mongoose.model("Message", {
  name: String,
  score: Number,
});

app.use(express.static("./dist"));
app.use(bodyParser.urlencoded({ extended: false }));

// Kod

io.on("connection", (socket) => {
  console.log("Användare ansluten");
});

http.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});