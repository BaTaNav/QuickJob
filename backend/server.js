// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Laadt .env

const supabase = require("./supabaseClient");

const authRouter = require("./auth/auth");
const clientsRouter = require("./clients/clients");
const jobsRouter = require("./jobs/jobs");
const studentsRouter = require("./students/students");

const clientsRouter = require("./clients/clients"); // ⬅️ your clients file
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Root test
app.get("/", (req, res) => {
  res.send("Backend met Supabase connectie draait!");
});

// Test Supabase
app.get("/test-db", async (req, res) => {
  const { data, error } = await supabase.from("jouw_tabel").select("*");
  if (error) return res.status(400).json(error);
  res.json(data);
});

// Mount clients router
// Mount routers
app.use("/auth", authRouter);
app.use("/clients", clientsRouter);

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});

module.exports = app;
