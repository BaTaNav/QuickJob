// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./supabaseClient");
const clientsRouter = require("./clients/clients");
const jobsRouter = require("./jobs/jobs");
const studentsRouter = require("./students/students");
const adminRouter = require("./Admin/Admin");
const authRouter = require("./auth/auth");
const { paymentsRouter, paymentsWebhookHandler } = require("./payments/stripe");


const app = express();
const port = process.env.PORT || 3000;

app.use(cors());


// Stripe heeft raw body nodig voor signature verificatie
app.post("/payments/webhook", express.raw({ type: "application/json" }), paymentsWebhookHandler);

// Nu pas JSON parsing voor andere routes
app.use(express.json());

// Root test
app.get("/", (req, res) => {
  res.send("QuickJob Backend API is running!");
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount routers
app.use("/clients", clientsRouter);
app.use("/jobs", jobsRouter);
app.use("/students", studentsRouter);
app.use("/admin", adminRouter);
app.use("/auth", authRouter);
app.use("/payments", paymentsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

module.exports = app;
