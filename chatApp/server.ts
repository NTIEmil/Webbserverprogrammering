const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const mongoose = require("mongoose");

const dbUrl =
  "mongodb+srv://emil:J6j7B3W8MpEJ8ucX@cluster0.e1wd3iz.mongodb.net/?retryWrites=true&w=majority";

try {
  mongoose.connect(dbUrl);
  console.log("Ansluten till MongoDB");
} catch {
  console.log(Error);
}

let Message = mongoose.model("Message", {
  name: String,
  message: String,
});

app.use(express.static("./dist"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/messages", (req, res) => {
  Message.find().then((item) => {
    res.send(item);
  });
});

app.post("/messages", (req, res) => {
  let message = new Message(req.body);

  message
    .save()

    .then((item) => {
      io.emit("message", req.body);
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
