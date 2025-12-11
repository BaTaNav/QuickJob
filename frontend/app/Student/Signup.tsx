import { router } from 'expo-router';
import React, { useState } from 'react';
import Auth0 from 'react-native-auth0'; // <-- NODIG VOOR AUTH0

// Auth0 instantie (gebruikt dezelfde configuratie als Login/Callback)
const auth0 = new Auth0({
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '',
});

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // =========================================================
  // FUNCTIE 1: EIGEN SITE REGISTRATIE (BESTAANDE LOGICA)
  // =========================================================
  const handleSiteSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // HIER KOMT JOUW LOGICA VOOR DE EIGEN BACKEND REGISTRATIE
    console.log('Registratie via eigen site gestart met:', formData);
    // Voer hier de POST request uit naar je /auth/signup endpoint
  };

  // =========================================================
  // FUNCTIE 2: AUTH0 REGISTRATIE (GEFIXED)
  // =========================================================
  const handleAuth0Signup = async () => {
    try {
      const authParams = {
        scope: 'openid profile email',
        audience: process.env.EXPO_PUBLIC_AUTH0_AUDIENCE,
        redirectUrl: 'http://localhost:8081/callback',

        // FIX: screen_hint en custom rol via custom query parameter
        screen_hint: 'signup',
        user_role: 'student', // <--- GEFIXED: De rol die de Action nu leest
      };

      // Casting naar 'any' om de strenge TypeScript check te omzeilen
      auth0.webAuth.authorize(authParams as any);

    } catch (error) {
      console.error('Auth0 Student Signup error:', error);
      alert('Registratie via Auth0 mislukt. Controleer de console.');
    }
  };
  // =========================================================


  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    marginBottom: '1.25rem',
    border: '2px solid #E1E7EB',
    borderRadius: '10px',
    fontSize: '0.9375rem',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: '#176B51',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    boxShadow: '0 2px 8px rgba(23, 107, 81, 0.2)',
  };

  const auth0ButtonLinkStyle = { // NIEUWE STIJL VOOR DE AUTH0 KNOP
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: '#FFFFFF',
    color: '#041316',
    border: '2px solid #E1E7EB',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '1rem',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  };

  const clientButtonStyle = {
    width: '100%',
    padding: '1rem 1.5rem',
    backgroundColor: '#FFFFFF',
    color: '#176B51',
    border: '2px solid #176B51',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    transition: 'background-color 0.2s ease, color 0.2s ease',
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 2rem',
      backgroundColor: '#F8FAFB',
      backgroundImage: 'linear-gradient(135deg, #F8FAFB 0%, #EDF1F2 100%)',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '2.5rem', marginTop: '2rem' }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: '800',
          color: '#176B51',
          letterSpacing: '-0.02em'
        }}>QuickJob</h1>
      </div>


      <div style={{
        width: '100%',
        maxWidth: '520px',
        padding: '3rem 3.5rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
        border: '1px solid rgba(225, 231, 235, 0.6)'
      }}>
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: '0.75rem',
          color: '#041316',
          letterSpacing: '-0.01em'
        }}>
          Create student account
        </h2>

        <p style={{
          textAlign: 'center',
          marginBottom: '2.5rem',
          color: '#5D6B73',
          fontSize: '0.9375rem'
        }}>
          Already have an account? <a href="/Login" style={{
            color: '#176B51',
            fontWeight: '600',
            textDecoration: 'none',
            borderBottom: '1px solid #176B51'
          }}>Sign in</a>
        </p>

        {/* Koppel de originele handler aan de form submit */}
        <form onSubmit={handleSiteSignup}>
          <label htmlFor="fullName" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            placeholder='Full Name'
            value={formData.fullName}
            onChange={handleChange}
            style={inputStyle}
            aria-label="Full Name"
          />

          <label htmlFor="email" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Email</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} style={inputStyle} aria-label="Email" />

          <label htmlFor="password" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Password</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} aria-label="Password" />

          <p style={{ fontSize: '0.8125rem', color: '#5D6B73', marginTop: '-1rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Must be at least 8 characters with uppercase and number
          </p>

          <label htmlFor="confirmPassword" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Confirm password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} style={inputStyle} aria-label="Confirm password" />


          <button type="submit" style={buttonStyle}>
            Sign Up via QuickJob
          </button>
        </form>

        {/* --- OPTIE 2: AUTH0 KNOP TOEGEVOEGD --- */}
        <div style={{
          textAlign: 'center',
          margin: '1.5rem 0',
          color: '#5D6B73',
          fontSize: '0.875rem',
          position: 'relative'
        }}>
          <span style={{
            backgroundColor: '#FFFFFF',
            padding: '0 1rem',
            position: 'relative',
            zIndex: 1
          }}>of</span>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#E1E7EB',
            zIndex: 0
          }}></div>
        </div>

        <button onClick={handleAuth0Signup} style={auth0ButtonLinkStyle}>
          Sign Up met Auth0
        </button>
        {/* --- EINDE OPTIE 2 --- */}


        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid #E1E7EB'
        }}>
          <p style={{
            marginBottom: '1rem',
            color: '#041316',
            fontSize: '0.9375rem',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            Liever als client beginnen?
          </p>
          <button
            style={clientButtonStyle}
            onClick={() => router.push('/Client/Signup')}
          >
            Maak client account
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <a href="/forgot-password" style={{
            color: '#5D6B73',
            textDecoration: 'none',
            fontSize: '0.9375rem'
          }}>
            Forgot password?
          </a>
        </div>
      </div>

    </div>
  );
};

export default Signup;