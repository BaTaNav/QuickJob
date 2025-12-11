const express = require('express');
const cors = require('cors');

const { clientsRouter, jobsRouter } = require('./clients/clients');
const supabase = require('./supabaseClient');
require('dotenv').config(); // Laadt de variabelen uit .env

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Supabase is provided by ./supabaseClient

app.get('/', (req, res) => {
  res.send('Backend met Supabase connectie draait!');
});



// Voorbeeld endpoint om data op te halen
app.get('/test-db', async (req, res) => {
  // Vervang 'jouw_tabel' met een echte tabelnaam uit je database
  const { data, error } = await supabase.from('jouw_tabel').select('*');
  if (error) return res.status(400).json(error);
  res.json(data);
});

// Mount clients routes (CRUD endpoints)
app.use('/clients', clientsRouter);

// Mount jobs routes (defined inside clients/clients.js per request)
app.use('/jobs', jobsRouter);

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});