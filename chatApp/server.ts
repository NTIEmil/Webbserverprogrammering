const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

// 402 Payment Required

// type chatMessage = {
//   name: string;
//   message: string;
// };

app.use(express.static("./dist"));
app.use(bodyParser.urlencoded({ extended: false }));

const fs = require("fs");

// @ts-ignore
let messages;

// @ts-ignore
// let messages: [any];

// @ts-ignore
fs.readFile("./messages.json", "utf8", (error, json) => {
  if (error) {
    console.log(error);
    app.res.sendStatus(500);
    return;
  }
  try {
    messages = JSON.parse(json);
  } catch (error) {
    console.log(error);
    app.res.sendStatus(500);
  }

  app.res.sendStatus(200);
});

// let messages = [
//   { name: "Mathias", message: "Hej" },
//   { name: "Henrik", message: "Hellå" },
// ];

// @ts-ignore
app.get("/messages", (req, res) => {
  res.send(messages);
});

// @ts-ignore
app.post("/messages", (req, res) => {
  try {
    messages.push(req.body);
    io.emit("message", req.body);

    // @ts-ignore
    fs.writeFile(
      "./messages.json",
      JSON.stringify(messages),
      "utf8",
      (error) => {
        if (error) {
          console.log(error);
          res.sendStatus(500);
        } else {
          console.log("writeFile complete");
          res.sendStatus(200);
        }
      }
    );
  } catch {
    res.sendStatus(400);
  }
});

// @ts-ignore
io.on("connection", (socket) => {
  console.log("Användare ansluten");
});

http.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});
