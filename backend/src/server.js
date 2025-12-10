const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { expressjwt: jwt } = require('express-jwt'); // <- correct import
const jwks = require('jwks-rsa');

const checkJwt = jwt({
  secret: jwks.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),
  audience: process.env.AUTH0_AUDIENCE,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.get('/', (req, res) => {
  res.send('Backend met Supabase connectie draait!');
});

app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('jouw_tabel').select('*');
  if (error) return res.status(400).json(error);
  res.json(data);
});

app.get('/secure', checkJwt, (req, res) => {
  res.send('Authorized');
});

app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});
