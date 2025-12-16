// backend/server.js
const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Laadt .env

const supabase = require("./supabaseClient");
const clientsRouter = require("./clients/clients"); // your clients file
//const jobsRouter = require("./jobs/jobs");           //jobs ook mounten
const app = express();
const port = 3000;

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
app.use("/clients", clientsRouter);

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});

module.exports = app;