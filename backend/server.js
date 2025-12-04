const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Laadt de variabelen uit .env

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Supabase Configuratie
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});