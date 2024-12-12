// import
import express from "express";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import {handleSignup} from './signup.js';

// create express app and define port
const app = express();
const PORT = 3000;

// set up middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(helmet.contentSecurityPolicy({
  directives : {
    defaultSrc: ["'self'"],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    scriptsrc: ["'self'",'https://cdngs.c1oudflare.com'],
  },
}));
app.set("view engine", "ejs");

// dummy survey data
let chartInputData = [3, 3, 3];

// function for generating the progress chart
async function generateChart(data) {
  const width = 600;
  const height = 400;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

  const differences = data.slice(1).map((value, index) => value - data[index]);

  const configuration = {
    type: "line",
    data: {
      labels: data.map((_, index) => `Survey ${index + 1}`),
      datasets: [
        {
          label: "Health Score",
          data: data,
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          fill: true,
        },
        {
          label: "Difference",
          data: [null, ...differences],
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderDash: [5, 5],
          fill: false,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: "Health Progress Scoring",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Survey Taken",
          },
        },
        y: {
          title: {
            display: true,
            text: "Health Progress Score",
          },
          min: 0,
          max: 5,
        },
      },
    },
  };

  return await chartJSNodeCanvas.renderToBuffer(configuration);
}

// define route for homepage
app.get("/", (req, res) => {
  // render the welcome.ejs template
  res.render("welcome.ejs");
});

// define route for survey tab
app.get("/survey", (req, res) => {
  // render the survey.ejs template
  res.render("survey.ejs");
});

// Route for login ("/login")
app.get ("/login", (req, res) => {
  res. render ('login');
});

// Route for signup ("/signup")
app.get("/signup", (reg, res) => {
res. render ('signup');
});

// define route for progress chart
app.get("/chart", async (req, res) => {
  const imageBuffer = await generateChart(chartInputData);
  res.set("Content-Type", "image/png");
  res.send(imageBuffer);
});

// define submitting the survey
app.post("/submit-survey", (req, res) => {
  const scores = Object.values(req.body).map(Number);
  const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  chartInputData.push(averageScore);

  res.redirect("/survey");
});

// Handle POST request for login
app.post('/login', (req, res) => {
  const {email, password } = req. body;

  fs.readFile('users.txt', 'utf8', (err, data) => {
    if (err) {
      console.log(err);
      return res.send( 'Error reading user data');
    }
    const users = data.split('\n').map(line => {
      const [name, email, password] = line.split('/');
      return { name, email, password };
    });
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      res.redirect('/survey');
    } else {
      res.render('login', { error: 'Incorrect credentials. Please try again.' });
    }
  });
});

// Handle POST request for signup
app.post('/signup', handleSignup); 

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
