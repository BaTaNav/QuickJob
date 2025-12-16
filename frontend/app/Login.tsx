import React, { useState } from 'react';
import { useRouter } from 'expo-router';

export default function Login({ title = 'Login' }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const router = useRouter();

  const handleNormalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Normale login via jouw backend
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Login successful:', data);
        // Redirect naar dashboard
        router.push('/Student/Dashboard');
      } else {
        const error = await response.text();
        console.error('Login failed:', error);
        alert('Login failed: ' + error);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login error. Check console for details.');
    }
  };

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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#F8FAFB',
      backgroundImage: 'linear-gradient(135deg, #F8FAFB 0%, #EDF1F2 100%)',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #E1E7EB',
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#176B51" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
        <span style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#041316',
          letterSpacing: '-0.01em'
        }}>QuickJob</span>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '3rem 2rem',
        overflowY: 'auto'
      }}>
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
            {title}
          </h2>
          
          <p style={{ 
            textAlign: 'center', 
            marginBottom: '2.5rem',
            color: '#5D6B73',
            fontSize: '0.9375rem'
          }}>
            Don't have an account? <a href="/Signup" style={{ 
              color: '#176B51', 
              fontWeight: '600',
              textDecoration: 'none',
              borderBottom: '1px solid #176B51'
            }}>Sign up</a>
          </p>

          <form onSubmit={handleNormalLogin}>
            <label htmlFor="email" style={{ 
              fontWeight: '600', 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#041316',
              fontSize: '0.875rem'
            }}>Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              aria-label="Email"
            />

            <label htmlFor="password" style={{ 
              fontWeight: '600', 
              display: 'block',
              marginBottom: '0.5rem',
              color: '#041316',
              fontSize: '0.875rem'
            }}>Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              aria-label="Password"
            />

            <button type="submit" style={buttonStyle}>
              Login
            </button>
          </form>

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
    </div>
  );
}
