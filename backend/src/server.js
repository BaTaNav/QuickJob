const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const { expressjwt: jwt } = require('express-jwt');
const jwks = require('jwks-rsa');

// =========================================================
// AUTHENTICATIE CONFIGURATIE (checkJwt)
// =========================================================

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

// =========================================================
// AUTORISATIE MIDDLEWARE (checkRole) - NIEUW
// =========================================================


const ROLE_CLAIM_NAMESPACE = 'https://localhost:8081/role'; 

const checkRole = (requiredRole) => (req, res, next) => {

    const userRole = req.auth[ROLE_CLAIM_NAMESPACE]; 
    
    console.log(`Verifieer toegang: Vereist=${requiredRole}, Gebruiker=${userRole}`);

    if (userRole === requiredRole) {
        // Rol klopt, ga door
        next(); 
    } else {
        // Rol klopt niet
        res.status(403).send({ 
            error: 'Forbidden', 
            message: `Toegang geweigerd. Vereiste rol: ${requiredRole}.` 
        });
    }
};

// =========================================================
// APPLICATIE INITIALISATIE
// =========================================================

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// =========================================================
// PUBLIEKE ROUTES
// =========================================================

app.get('/', (req, res) => {
  res.send('Backend met Supabase connectie draait!');
});

app.get('/test-db', async (req, res) => {
  const { data, error } = await supabase.from('jouw_tabel').select('*');
  if (error) return res.status(400).json(error);
  res.json(data);
});

// =========================================================
// BEVEILIGDE ROUTES MET ROLCONTROLE - NIEUW
// =========================================================

// 1. STUDENT ENDPOINT
// Vereist: Geldig Access Token EN de rol 'student'
app.get('/api/student/dashboard', 
    checkJwt, 
    checkRole('student'), // Autoriseert alleen studenten
    async (req, res) => {
        const userId = req.auth.sub; // Auth0 User ID
        
        res.json({ 
            message: `Welkom, Student! Je bent gemachtigd.`, 
            userId: userId,
            data: 'Studentenrooster data' 
        });
    }
);

// 2. CLIENT ENDPOINT
// Vereist: Geldig Access Token EN de rol 'client'
app.get('/api/client/dashboard', 
    checkJwt, 
    checkRole('client'), // Autoriseert alleen clients
    async (req, res) => {
        const userId = req.auth.sub; // Auth0 User ID

        // VOORBEELD: Supabase query om alleen data van deze client op te halen
        // const { data, error } = await supabase.from('projecten').select('*').eq('client_id', userId);

        res.json({ 
            message: `Welkom, Client! Je bent gemachtigd.`, 
            userId: userId,
            data: 'Client projecten data' 
        });
    }
);


app.listen(port, () => {
  console.log(`Server draait op http://localhost:${port}`);
});