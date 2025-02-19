// imports
import express from "express";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { handleSignup } from "./signup.js";

const app = express();
const PORT = 3000; // local port

// set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"]
    }
  })
);
app.set("view engine", "ejs");

let userProgress = {};

app.get("/", (req, res) => {
  res.redirect("/login");
});

// login
app.get("/login", (req, res) => {
  res.render("login");
});

// signup
app.get("/signup", (req, res) => {
  res.render("signup");
});

// logout, goes back to login page
app.get("/logout", (req, res) => {
  userProgress = {}; // Reset progress
  res.redirect("/login");
});

// home page, to start surveys
app.get("/home", (req, res) => {
  res.render("home");
});

// surveys
app.get("/survey", (req, res) => {
  const section = req.query.section || "general"; // Default to 'general'
  res.render("survey", { section });
});

app.get("/survey-choice", (req, res) => {
  res.render("survey-choice", { userProgress });
});

app.post("/submit-survey", (req, res) => {
  const { section } = req.body;
  userProgress[section] = true;

  if (userProgress.general && userProgress.mental && userProgress.physical) {
    return res.redirect("/survey?section=completed");
  } else if (section === "general") {
    return res.redirect("/survey-choice");
  } else {
    return res.redirect("/survey-choice");
  }
});

// Handle user login
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  fs.readFile("users.txt", "utf8", (err, data) => {
    if (err) {
      console.log(err);
      return res.send("Error reading user data");
    }
    const users = data.split("\n").map(line => {
      const [name, email, password] = line.split("/");
      return { name, email, password };
    });
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      res.redirect("/home");
    } else {
      res.render("login", { error: "Incorrect credentials. Please try again." });
    }
  });
});

// Handle user signup
app.post("/signup", handleSignup);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

