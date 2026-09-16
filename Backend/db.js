const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "bimbel_db",
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Error:", err);
  } else {
    console.log("MySQL Connected");
  }
});

module.exports = db;
