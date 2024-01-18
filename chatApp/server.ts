const express = require("express");
const app = express();

app.use(express.static("./dist"));

let messages = [
  { name: "Mathias", message: "Hej" },
  { name: "Henrik", message: "Hellå" },
];

// @ts-ignore
app.get("/messages", (req, res) => {
  res.send(messages);
});

app.listen(3000, () => {
  console.log("Servern körs, besök http://localhost:3000");
});
