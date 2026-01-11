# QuickJob

## Projectoverzicht

QuickJob is een platform dat studenten verbindt met flexibele jobs. Het project bestaat uit een React Native/Expo frontend (cross-platform: web, iOS, Android) en een Node.js/Express backend met Supabase als database en Stripe voor betalingen.

**Context**: Dual-sided marketplace waarbij clients jobs kunnen plaatsen, studenten kunnen solliciteren, en admins de verificatie en incidentafhandeling beheren.

---

## Repositorystructuur

```
QuickJob/
├── backend/                      # Express.js API server
│   ├── server.js                 # Entry point
│   ├── supabaseClient.js         # Database client configuratie
│   ├── auth/                     # Authenticatie endpoints
│   ├── clients/                  # Client-gerelateerde routes
│   ├── students/                 # Student-gerelateerde routes
│   ├── jobs/                     # Job management (CRUD, applications)
│   ├── payments/                 # Stripe integration
│   ├── incidents/                # Incident reporting
│   └── Admin/                    # Admin panel endpoints
│
├── frontend/                     # Expo (React Native) applicatie
│   ├── app/                      # Screens (Expo Router)
│   │   ├── Client/               # Client flows (PostJob, Dashboard, Profile)
│   │   ├── Student/              # Student flows (Dashboard, Job browsing, Applications)
│   │   └── Admin/                # Admin panel (Verification, Incidents)
│   ├── services/                 # API client
│   ├── components/               # Reusable UI components
│   └── types/                    # TypeScript type definitions
│
└── *.md                          # Feature-specifieke documentatie
```

### Toelichting hoofdmappen

- **backend/**: RESTful API met Express.js. Alle business logic, database queries via Supabase client, Stripe integratie.
- **frontend/**: Expo app met file-based routing (expo-router). API calls via centralized service ([services/api.ts](frontend/services/api.ts)).
- **PostJob_IMPLEMENTATION.md**: Gedetailleerde technische documentatie van de job posting feature (4-staps wizard, validatie, API endpoints).

---

## Installatie & Setup

### Vereisten

- Node.js (v16+)
- npm of yarn
- Expo CLI: `npm install -g expo-cli`
- Supabase account (voor database)
- Stripe account (voor betalingen)

### Backend

1. **Installeer dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configureer environment variables**
   
   Maak `.env` bestand aan in `backend/`:
   ```env
   PORT=3000
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-role-key
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_DEFAULT_CURRENCY=eur
   STRIPE_FEE_PERCENT=0
   STRIPE_CONNECT_COUNTRY=BE
   STRIPE_CONNECT_RETURN_URL=https://example.com/stripe/return
   STRIPE_CONNECT_REFRESH_URL=https://example.com/stripe/refresh
   ```

3. **Start server**
   ```bash
   npm start
   ```
   Server draait op `http://localhost:3000`.

### Frontend

1. **Installeer dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configureer API base URL**
   
   In [frontend/services/api.ts](frontend/services/api.ts), pas `API_BASE_URL` aan:
   ```typescript
   const API_BASE_URL = Platform.OS === 'web' 
     ? 'http://localhost:3000' 
     : 'http://<YOUR_LOCAL_IP>:3000';
   ```

3. **Start Expo development server**
   ```bash
   npm start
   ```
   - Web: druk `w`
   - iOS Simulator: druk `i` (macOS + Xcode vereist)
   - Android Emulator: druk `a` (Android Studio vereist)
   - Physical device: scan QR met Expo Go app

---

## Technologiekeuzes

### Backend

| Technologie | Versie | Gebruik |
|-------------|--------|---------|
| Node.js | v16+ | Runtime |
| Express.js | 5.2.1 | Web framework |
| Supabase JS | 2.86.0 | PostgreSQL client |
| bcrypt | 5.1.1 | Password hashing |
| Stripe | 20.1.2 | Payment processing (Connect) |
| multer | 2.0.2 | File upload (image handling) |
| jsonwebtoken | 9.0.3 | JWT tokens |

### Frontend

| Technologie | Versie | Gebruik |
|-------------|--------|---------|
| React | 19.1.0 | UI library |
| React Native | 0.81.5 | Mobile framework |
| Expo | 54.0.25 | Development platform |
| TypeScript | 5.9.2 | Type safety |
| Expo Router | 6.0.15 | File-based routing |
| Stripe React Native | 0.50.3 / 8.6.1 | Payment SDK (native/web) |
| AsyncStorage | 2.2.0 | Local storage |

### Database

Supabase (PostgreSQL). Tabellen: `users`, `jobs`, `job_categories`, `job_applications`, `student_stripe_accounts`, `job_payments`, `incidents`.



### Experimentele keuzes

- **Geocoding & distance filtering**: Haversine-formule voor afstandsberekening tussen gebruiker en jobs (latitude/longitude).
- **Platform-specific Stripe implementations**: Aparte implementaties voor native (`stripe.native.ts`) en web (`stripe.web.tsx`).
- **Click-based UI**: PostJob wizard minimaliseert typing via presets en auto-suggesties.

---

## Functionaliteiten

### Authenticatie
- **Registratie**: Studenten en clients via `POST /auth/register/student` en `POST /clients/register-client`
- **Login**: Universele login voor alle rollen via `POST /auth/login`
- **Password security**: bcrypt hashing (10 salt rounds)

### Job Management
- **Job posting** ([PostJob.tsx](frontend/app/Client/PostJob.tsx)): 4-staps wizard met categorie-selectie, adres (gestructureerd), planning, budget, beschrijving
- **Job browsing** ([Dashboard.tsx](frontend/app/Student/Dashboard.tsx)): Filtering op categorie, afstand (GPS + Haversine), datum
- **Applications**: Studenten solliciteren via `POST /jobs/:jobId/apply`, clients accepteren/rejecteren via `PUT /jobs/:jobId/applications/:applicationId/status`

### Betalingen
- **Stripe Connect**: Studenten setup Express accounts voor payouts via `POST /payments/connect-account`
- **Payment Intents**: Clients betalen via `POST /payments/create-payment-intent`
- **Webhooks**: `POST /payments/webhook` verwerkt payment events

### Admin Panel
- **User management**: View/update users via `GET /admin/users`, `PUT /admin/users/:id`
- **Student verificatie**: `PUT /admin/users/:id/verify`
- **Incident management**: Create/update incidents via `/incidents` endpoints

### Overige features
- **Image uploads**: Supabase Storage voor job afbeeldingen en profielfoto's
- **Multi-language support**: nl/fr/en voor job categories
- **Responsive design**: Platform-specific styling voor web/mobile

---

## Architectuur

**Client-Server architectuur** met RESTful API:

```
[React Native App] --HTTP--> [Express API] --Supabase Client--> [PostgreSQL]
                                   |
                                   +---> [Stripe API]
                                   |
                                   +---> [Supabase Storage]
```

### Scheiding van verantwoordelijkheden

- **Frontend**: UI rendering, user input handling, API calls. Stateless.
- **Backend**: Business logic, authentication, authorization, database queries, payment processing.
- **Database**: Data persistence (Supabase PostgreSQL).
- **Storage**: File storage (Supabase Storage bucket: `job-images`).
- **Payments**: External service (Stripe).

**Backend gebruikt Supabase service key** (bypasses Row Level Security). Geen RLS policies geïmplementeerd.

---

## Documentatie & Bewijs

### Git-geschiedenis
Commit history en branch-gebruik zijn te vinden in de Git repository zelf.

### Taskboard
[Trello board link.](https://trello.com/invite/b/691c334b7fb6f6bbd590f91e/ATTIff54885c021cbddcb309cdb3f9a64c8aE1C92D9F/it-project)

### API Documentatie
Geen formele API documentatie (OpenAPI/Swagger) aanwezig. API endpoints zijn afgeleid uit code:
- Authenticatie: [backend/auth/auth.js](backend/auth/auth.js)
- Jobs: [backend/jobs/jobs.js](backend/jobs/jobs.js)
- Studenten: [backend/students/students.js](backend/students/students.js)
- Clients: [backend/clients/clients.js](backend/clients/clients.js)
- Payments: [backend/payments/stripe.js](backend/payments/stripe.js)
- Admin: [backend/Admin/Admin.js](backend/Admin/Admin.js)
- Incidents: [backend/incidents/incidents.js](backend/incidents/incidents.js)

### Database Schema

**Belangrijkste tabellen**:
- `users`: id, email, password_hash, role, phone, preferred_language, two_factor_enabled
- `jobs`: id, client_id, category_id, title, description, street, house_number, postal_code, city, latitude, longitude, hourly_or_fixed, hourly_rate, fixed_price, start_time, end_time, status, image_url
- `job_categories`: id, key, name_nl, name_fr, name_en
- `job_applications`: id, job_id, student_id, status, applied_at
- `student_stripe_accounts`: student_id, stripe_account_id, charges_enabled, payouts_enabled, details_submitted
- `job_payments`: id, job_id, student_id, client_id, amount, currency, stripe_payment_intent_id, status
- `incidents`: id, job_id, application_id, student_id, client_id, status, severity, summary, description, admin_notes

---

## GDPR & Security

### Verwerkte Data
- **Persoonsgegevens**: Email, telefoon (optioneel), wachtwoorden (gehashed)
- **Locatiegegevens**: GPS coördinaten (user location voor filtering), job adressen (straat, huisnummer, postcode, stad, lat/lon)
- **Financiële gegevens**: Stripe account IDs, payment intents (opgeslagen in `job_payments`)


### Geïmplementeerde beveiligingsmaatregelen
- **Password hashing**: bcrypt (10 salt rounds) in [backend/auth/auth.js](backend/auth/auth.js), [backend/clients/clients.js](backend/clients/clients.js)
- **Environment variables**: Credentials in `.env` (uitgesloten via `.gitignore`)
- **CORS**: Enabled via cors middleware in [backend/server.js](backend/server.js)
- **Stripe webhook verification**: Signature validatie in [backend/payments/stripe.js](backend/payments/stripe.js)
- **Role-based filtering**: Endpoints filteren data op `client_id`/`student_id`

---

**Versie**: 1.0.0  

