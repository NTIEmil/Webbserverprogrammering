let mysql = require("mysql2");

let connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "0407",
  database: "test",
});

// Ansluter till databasen
// connection.connect(function(err) {
//     if (err) throw err;
//     console.log("Ansluten till databasen!");
// });

// Hämtar poster från databasen
connection.connect(function (err) {
  if (err) throw err;
  console.log("Ansluten till databasen!");
  connection.query("SELECT * FROM elev", function (err, result, fields) {
    if (err) throw err;
    console.log(result);
  });
});

// Lägger till en post i databasen
// connection.connect(function (err) {
//   if (err) throw err;
//   console.log("Ansluten till databasen!");
//     let sql = "INSERT INTO elev (fornamn, efternamn) VALUES ('Agnes', 'Öman')";
//     connection.query(sql, function (err, result) {
//       if (err) throw err;
//       console.log("Elev tillagd i databasen!");
//     });
// });
