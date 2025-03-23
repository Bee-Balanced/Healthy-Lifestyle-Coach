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
  overall: [],
  mental: [],
  physical: [],
  days: []
};
let allResponses = [];


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
  const adviceMap = {
    "I drink 8 glasses of water daily.": "Drinking 8 cups of water daily improves brain function, boosts energy, and supports digestion.",
    "I eat meals regularly.": "Consistent meals keep your metabolism steady and your energy up.",
    "I feel sluggish and tired most of the time.": "Low energy can signal poor sleep, hydration, or nutrition—addressing these can help.",
    "I am hopeful about the future.": "Maintaining hope improves mental resilience and reduces stress.",
    "I am satisfied with my daily life.": "Satisfaction is tied to meaningful routines—celebrate small wins each day.",
    "I have trouble concentrating.": "Breaks, sleep, and limiting distractions can sharpen your focus.",
    "I feel disconnected from everyone.": "Connection boosts happiness—try reaching out or joining small groups.",
    "I feel like I’m the only one struggling.": "You're not alone—talking to others often reveals shared challenges.",
    "I don’t feel I’m as good as everyone.": "Self-worth grows through compassion—focus on progress, not perfection.",
    "I’m sad and unhappy all the time.": "Mood issues may need support—talk to someone and build uplifting habits.",
    "I use electronic devices after midnight.": "Late screen time affects sleep—power down early to rest better.",
    "I exercise for 30 minutes or more every day.": "Exercise boosts mood, focus, and long-term health.",
    "I go outside for the sun at least 10 minutes a day.": "Sunlight helps regulate sleep and boosts Vitamin D.",
    "I sleep for 7 to 8 hours.": "Sleep restores the brain and body—aim for consistent, quality rest.",
    "I drink caffeinated drinks excessively.": "Too much caffeine disrupts sleep and can increase anxiety."
  };

  // Utility to get lowest 3 average scores by section
  function getLowestFeedback(section) {
    const filtered = allResponses.filter(r => r.section === section);
    const questionAverages = {};

    filtered.forEach(({ question, score }) => {
      if (!questionAverages[question]) {
        questionAverages[question] = { total: 0, count: 0 };
      }
      questionAverages[question].total += score;
      questionAverages[question].count += 1;
    });

    const scored = Object.entries(questionAverages).map(([question, data]) => ({
      question,
      avgScore: data.total / data.count
    }));

    return scored
      .sort((a, b) => a.avgScore - b.avgScore)
      .slice(0, 3)
      .map(entry => ({
        question: entry.question,
        advice: adviceMap[entry.question]
      }));
  }

  res.render("home", {
    overallData: surveyResults.overall,
    mentalData: surveyResults.mental,
    physicalData: surveyResults.physical,
    days: surveyResults.days,
    overallFeedback: getLowestFeedback("general"),
    mentalFeedback: getLowestFeedback("mental"),
    physicalFeedback: getLowestFeedback("physical")
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

  let scores = Object.entries(req.body)
    .filter(([key, value]) => key.startsWith("q") && !isNaN(value))
    .map(([key, value], index) => {
      const questionIndex = parseInt(key.replace("q", "")) - 1;
      const allQuestions = {
        general: [
          "I drink 8 glasses of water daily.",
          "I eat meals regularly.",
          "I feel sluggish and tired most of the time.",
          "I am hopeful about the future.",
          "I am satisfied with my daily life."
        ],
        mental: [
          "I have trouble concentrating.",
          "I feel disconnected from everyone.",
          "I feel like I’m the only one struggling.",
          "I don’t feel I’m as good as everyone.",
          "I’m sad and unhappy all the time."
        ],
        physical: [
          "I use electronic devices after midnight.",
          "I exercise for 30 minutes or more every day.",
          "I go outside for the sun at least 10 minutes a day.",
          "I sleep for 7 to 8 hours.",
          "I drink caffeinated drinks excessively."
        ]
      };

      const questionText = allQuestions[section][questionIndex];
      return {
        section,
        question: questionText,
        score: parseInt(value)
      };
    });

  // Save to master response list
  allResponses.push(...scores);

  // Update average score per section (for charting)
  let avgScore = scores.length > 0
    ? Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length)
    : 0;

  if (section === "general") {
    surveyResults.overall.push(avgScore);
  } else if (section === "mental") {
    surveyResults.mental.push(avgScore);
  } else if (section === "physical") {
    surveyResults.physical.push(avgScore);
  }

  // Add a new day
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
