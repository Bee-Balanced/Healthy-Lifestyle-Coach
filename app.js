// Imports
import express from "express";
import helmet from "helmet";
import fs from "fs";
import path from "path";
import { handleSignup } from "./signup.js";

const app = express();
const PORT = 3000; // Local port

// Set up middleware
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
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' https://cdn.plot.ly;");
  next();
});

app.set("view engine", "ejs");

let userProgress = {};
let surveyResults = {
  overall: [5, 8, 2],
  mental: [7, 6, 5],
  physical: [8, 7, 9],
  days: ['Day 1', 'Day 2', 'Day 3']
};

// Redirect to login page
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Login route
app.get("/login", (req, res) => {
  res.render("login");
});

// Signup route
app.get("/signup", (req, res) => {
  res.render("signup");
});

// Logout and reset progress
app.get("/logout", (req, res) => {
  userProgress = {};
  res.redirect("/login");
});

// Home page - Displays updated charts
app.get("/home", (req, res) => {
  res.render("home", { 
    overallData: surveyResults.overall, 
    mentalData: surveyResults.mental, 
    physicalData: surveyResults.physical, 
    days: surveyResults.days 
  });
});


// Survey route
app.get("/survey", (req, res) => {
  const section = req.query.section || "general"; // Default to 'general'
  res.render("survey", { section });
});

// Survey choice page
app.get("/survey-choice", (req, res) => {
  res.render("survey-choice", { userProgress });
});

// Handle survey submission and update charts
app.post("/submit-survey", (req, res) => {
  const { section } = req.body;
  userProgress[section] = true;

  // Extract and calculate the average score from the responses
  let scores = Object.values(req.body)
    .filter(value => !isNaN(value)) // Keep only numeric values
    .map(Number); // Convert to numbers

  let newScore = scores.length > 0 ? 
    Math.round(scores.reduce((sum, val) => sum + val, 0) / scores.length) : 0; // Average

  // Add the calculated average score to the corresponding section
  if (section === "general") {
    surveyResults.overall.push(newScore);
  } else if (section === "mental") {
    surveyResults.mental.push(newScore);
  } else if (section === "physical") {
    surveyResults.physical.push(newScore);
  }

  // Ensure days array is updated
  const nextDay = `Day ${surveyResults.days.length + 1}`;
  surveyResults.days.push(nextDay);

  if (userProgress.general && userProgress.mental && userProgress.physical) {
    return res.redirect("/survey?section=completed");
  }
  return res.redirect("/survey-choice");
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
