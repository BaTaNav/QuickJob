import React, { useState, useEffect } from 'react';

type Props = {
  
  onSubmit?: (email: string, password: string) => void;
  title?: string; 
};

export default function Login({ onSubmit, title = 'Login' }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(email.trim(), password);
    }
  };

  // Force Browser Tab Title
  useEffect(() => {
    document.title = "QuickJob | Login ";
  }, []);

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
      height: '100vh', // Changed from minHeight to enforce scroll container
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
          {title}
        </h2>
        
        <p style={{ 
          textAlign: 'center', 
          marginBottom: '2.5rem',
          color: '#5D6B73',
          fontSize: '0.9375rem'
        }}>
          Don't have an account? <a href="Student/Signup" style={{ 
            color: '#176B51', 
            fontWeight: '600',
            textDecoration: 'none',
            borderBottom: '1px solid #176B51'
          }}>Sign up</a>
        </p>

        <form onSubmit={handleSubmit}>
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
          <a href="/Resetpassword" style={{ 
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
}