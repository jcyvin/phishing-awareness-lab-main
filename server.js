const express = require("express");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// --------------------------------------------------
// Serve the existing purple frontend
// --------------------------------------------------

app.use(express.static(path.join(__dirname, "public")));

// --------------------------------------------------
// MySQL connection pool
// --------------------------------------------------

const pool = mysql.createPool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 3306),

  user: process.env.DB_USER || "phishing_app",

  password: process.env.DB_PASSWORD || "",

  database: process.env.DB_NAME || "phishing_lab",

  waitForConnections: true,

  connectionLimit: 10,

  queueLimit: 0,
});

// --------------------------------------------------
// Test database connection
// --------------------------------------------------

async function testDatabase() {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL database connection successful.");

    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
  }
}

// --------------------------------------------------
// Simulation submission endpoint
// --------------------------------------------------

app.post("/api/simulation", async (req, res) => {
  try {
    const trainingId = String(req.body.training_id || "")
      .trim()
      .slice(0, 50);

    if (!trainingId) {
      return res.status(400).json({
        success: false,
        message: "Training ID is required.",
      });
    }

    // --------------------------------------------------
    // IMPORTANT:
    // We intentionally DO NOT read or store a password.
    // --------------------------------------------------

    const [result] = await pool.execute(
      `
                    INSERT INTO simulation_events
                    (
                        training_id,
                        event_type
                    )
                    VALUES
                    (
                        ?,
                        ?
                    )
                    `,
      [trainingId, "SIMULATION_SUBMISSION"],
    );

    const timestamp = new Date().toISOString();

    return res.json({
      success: true,

      eventId: result.insertId,

      trainingId,

      timestamp,
    });
  } catch (error) {
    console.error("Simulation logging error:", error);

    return res.status(500).json({
      success: false,

      message: "Unable to record simulation event.",
    });
  }
});

app.post("/api/login", async (req, res) => {
  const username = String(req.body.username || "").trim().slice(0, 50);

  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required.",
    });
  }

  try {
    const [result] = await pool.execute(
      `
        INSERT INTO simulation_events (training_id, event_type)
        VALUES (?, ?)
      `,
      [username, "SIMULATION_SUBMISSION"],
    );

    return res.json({
      success: true,
      eventId: result.insertId,
      username,
      loginTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Simulation logging error:", error);

    return res.json({
      success: true,
      eventId: null,
      username,
      loginTime: new Date().toISOString(),
      message: "Simulation completed locally; database logging is unavailable.",
    });
  }
});

app.get("/api/calendar", (req, res) => {
  res.download(path.join(__dirname, "public", "calendar.bat"), "calendar.bat");
});

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",

      database: "connected",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",

      database: "disconnected",
    });
  }
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", async () => {
  console.log(`Security Awareness Lab running on port ${PORT}`);

  await testDatabase();
});