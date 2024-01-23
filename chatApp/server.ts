const express = require("express");
const bodyParser = require("body-parser");
const app = express();

// 402 Payment Required

// type chatMessage = {
//   name: string;
//   message: string;
// };

app.use(express.static("./dist"));
app.use(bodyParser.urlencoded({ extended: false }));

let messages = [
  { name: "Mathias", message: "Hej" },
  { name: "Henrik", message: "Hellå" },
];

// @ts-ignore
app.get("/messages", (req, res) => {
  res.send(messages);
});

// @ts-ignore
app.post("/messages", (req, res) => {
  try {
    messages.push(req.body);
    res.sendStatus(200);
  } catch {
    res.sendStatus(400);
  }
});

app.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});
