// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const supabase = require("./supabaseClient");
const verifyJwt = require("./auth/verifyJwt");
const sanitize = require("./middleware/sanitize");
const { authLimiter, apiLimiter, uploadLimiter } = require("./middleware/rateLimiter");
const { requireRole } = require("./middleware/roleGuard");

const clientsRouter = require("./clients/clients");
const jobsRouter = require("./jobs/jobs");
const studentsRouter = require("./students/students");
const adminRouter = require("./Admin/Admin");
const authRouter = require("./auth/auth");
const incidentsRouter = require("./incidents/incidents");
const invoicesRouter = require("./invoices/invoices");
const uploadsRouter = require("./uploads/uploads");

const app = express();
const port = process.env.PORT || 3000;

// ── Security headers ──────────────────────────────────────────
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  next();
});

// ── CORS (restrict in production) ─────────────────────────────
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:8081", "http://localhost:19006", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400, // Pre-flight cache 24h
  })
);

// ── Body parsing with size limits ──────────────────────────────
app.use(express.json({ limit: "10mb" })); // 10MB for image uploads
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ── Input sanitization ────────────────────────────────────────
app.use(sanitize);

// ── Request logging (production-friendly) ─────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? "warn" : "info";
    const logMsg = `[${logLevel.toUpperCase()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    if (res.statusCode >= 500) {
      console.error(logMsg);
    } else if (res.statusCode >= 400) {
      console.warn(logMsg);
    } else if (process.env.NODE_ENV !== "production") {
      console.log(logMsg);
    }
    originalEnd.apply(res, args);
  };
  next();
});

// ── Root ──────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ name: "QuickJob API", version: "1.0.0", status: "running" });
});

// ── Health check ──────────────────────────────────────────────
app.get("/health", async (req, res) => {
  try {
    // Check Supabase connection
    const { error } = await supabase.from("users").select("id").limit(1);
    res.json({
      status: error ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      database: error ? "unreachable" : "connected",
      uptime: process.uptime(),
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "error",
    });
  }
});

// ── Public routes ─────────────────────────────────────────────
app.use("/auth", authLimiter, authRouter);
app.use("/jobs", apiLimiter, jobsRouter);

// ── Protected routes (JWT required) ───────────────────────────
app.use("/clients", apiLimiter, verifyJwt, clientsRouter);
app.use("/students", apiLimiter, verifyJwt, studentsRouter);
app.use("/admin", apiLimiter, verifyJwt, requireRole("admin"), adminRouter);
app.use("/incidents", apiLimiter, verifyJwt, incidentsRouter);
app.use("/invoices", apiLimiter, verifyJwt, invoicesRouter);

// ── Upload routes (stricter rate limit, auth optional for registration) ─
app.use("/uploads", uploadLimiter, uploadsRouter);

// ── 404 handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({ error: "CORS policy: Origin not allowed" });
  }

  // JSON parse errors
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body too large" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }

  console.error("Unhandled server error:", err.stack || err);
  res.status(500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
  });
});

// ── Start server ─────────────────────────────────────────────
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "fallback-dev-secret") {
    console.warn("WARNING: JWT_SECRET is not set or using fallback. Set a strong secret in production!");
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.warn("WARNING: Supabase credentials not fully configured.");
  }
});

module.exports = app;
