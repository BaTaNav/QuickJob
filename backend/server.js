const express = require("express");
const cors = require("cors");
require("dotenv").config();

const clientsRouter = require("./clients/clients");
const jobsRouter = require("./jobs/jobs");
const studentsRouter = require("./students/students");
const adminRouter = require("./Admin");
const { publicApiLimiter } = require("./auth/rateLimiters");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.set("trust proxy", 1);

// ✅ Global limiter for everything EXCEPT login routes
app.use((req, res, next) => {
  if (req.path === "/admin/login" || req.path === "/clients/login") return next();
  return publicApiLimiter(req, res, next);
});

app.get("/", (req, res) => res.send("QuickJob Backend API is running!"));
app.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() })
);

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
