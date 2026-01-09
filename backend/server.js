// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { supabase } = require("./supabaseClient"); // or remove if unused
const clientsRouter = require("./clients/clients");
const jobsRouter = require("./jobs/jobs");
const studentsRouter = require("./students/students");
const adminRouter = require("./Admin");
const { publicApiLimiter } = require("./auth/rateLimiters");

// ✅ correct paths
const verifyJwt = require("./auth/verifyJwt");
const requireRole = require("./auth/requireRole");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(publicApiLimiter);
app.get("/", (req, res) => res.send("QuickJob Backend API is running!"));
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.use("/auth", require("./auth/auth"));


// Routers
app.use("/clients", clientsRouter);
app.use("/jobs", jobsRouter);
app.use("/students", studentsRouter);
app.use("/admin", adminRouter);

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
module.exports = app;
