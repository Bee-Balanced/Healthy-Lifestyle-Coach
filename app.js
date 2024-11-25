// import
import express from "express";

// create express app and define port
const app = express();
const PORT = 3000;

// set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// define route for homepage
app.get("/", (req, res) => {
  // render the welcome.ejs template
  res.render("welcome.ejs");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
