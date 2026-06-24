import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = process.env.PORT || 3000;

// Database Client using Connection String
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:suman@123@localhost:5432/world",
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});
db.connect().then(async () => {
  console.log("Database Connected successfully!");
  try {
    // 1. Live database mein table banana (agar nahi bani hai)
    await db.query(`
      CREATE TABLE IF NOT EXISTS capitals (
        id SERIAL PRIMARY KEY,
        country VARCHAR(100) NOT NULL,
        capital VARCHAR(100) NOT NULL
      );
    `);

    // 2. Check karna ki data pehle se hai ya nahi
    const checkData = await db.query("SELECT COUNT(*) FROM capitals");
    if (parseInt(checkData.rows[0].count) === 0) {
      console.log("Inserting capitals into live database...");
      
      // Ye code automatic saara data bhar dega
      await db.query(`
        INSERT INTO capitals (country, capital) VALUES 
        ('Saudi Arabia', 'Riyadh'),
        ('India', 'New Delhi'),
        ('France', 'Paris'),
        ('United States', 'Washington'),
        ('Japan', 'Tokyo'),
        ('Germany', 'Berlin'),
        ('United Kingdom', 'London'),
        ('Canada', 'Ottawa'),
        ('Australia', 'Canberra'),
        ('Russia', 'Moscow');
      `);
      console.log("Data inserted successfully!");
    }
  } catch (err) {
    console.error("Database setup error:", err);
  }
});

let quiz = [];
db.query("SELECT * FROM capitals",(err,res)=> {
  if(err){
    console.error("Error executing query",err.stack);
  }else{
    quiz=res.rows;
  }

})

let totalCorrect = 0;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentQuestion = {};

// GET home page
app.get("/", async (req, res) => {
  totalCorrect = 0;
  await nextQuestion();
  console.log(currentQuestion);
  res.render("index.ejs", { question: currentQuestion });
});

// POST a new post
app.post("/submit", (req, res) => {
  let answer = req.body.answer.trim();
  let isCorrect = false;
  if (currentQuestion.capital.toLowerCase() === answer.toLowerCase()) {
    totalCorrect++;
    console.log(totalCorrect);
    isCorrect = true;
  }

  nextQuestion();
  res.render("index.ejs", {
    question: currentQuestion,
    wasCorrect: isCorrect,
    totalScore: totalCorrect,
  });
});

async function nextQuestion() {
  const randomCountry = quiz[Math.floor(Math.random() * quiz.length)];

  currentQuestion = randomCountry;
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
