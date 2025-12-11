import React, { useState, useEffect } from 'react';

type Props = {
  onSubmit?: (email: string) => void;
};

export default function ForgotPassword({ onSubmit }: Props) {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(email.trim());
    }
    // Simulate API call success state
    setIsSubmitted(true);
  };

 
  useEffect(() => {
    document.title = "QuickJob | Reset Password";
    
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = 'https://cdn-icons-png.flaticon.com/512/2910/2910768.png'; 
    document.getElementsByTagName('head')[0].appendChild(link);
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
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 2rem',
      backgroundColor: '#F8FAFB',
      backgroundImage: 'linear-gradient(135deg, #F8FAFB 0%, #EDF1F2 100%)',
      overflowY: 'auto'
    }}>
      <div style={{ marginBottom: '2.5rem', marginTop: '2rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.25rem', 
          fontWeight: '800',
          color: '#176B51',
          letterSpacing: '-0.02em',
          margin: 0
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
          Reset Password
        </h2>
        
        {!isSubmitted ? (
          <>
            <p style={{ 
              textAlign: 'center', 
              marginBottom: '2.5rem',
              color: '#5D6B73',
              fontSize: '0.9375rem',
              lineHeight: '1.5'
            }}>
              Enter the email associated with your account and we'll send you a link to reset your password.
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
                aria-label="Email"
                required
              />

              <button type="submit" style={buttonStyle}>
                Send Reset Link
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <div style={{ 
              fontSize: '3rem', 
              marginBottom: '1rem' 
            }}>✉️</div>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: '#041316',
              marginBottom: '0.5rem'
            }}>Check your email</h3>
            <p style={{
              color: '#5D6B73',
              fontSize: '0.9375rem',
              marginBottom: '2rem'
            }}>
              We have sent a password reset link to <strong>{email}</strong>
            </p>
            <button 
              onClick={() => setIsSubmitted(false)}
              style={{
                ...buttonStyle,
                backgroundColor: '#FFFFFF',
                color: '#176B51',
                border: '2px solid #176B51',
                boxShadow: 'none'
              }}
            >
              Try another email
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem', borderTop: '1px solid #E1E7EB', paddingTop: '1.5rem' }}>
          <p style={{ 
            color: '#5D6B73', 
            fontSize: '0.9375rem'
          }}>
            Remember your password? <a href="/Login" style={{ 
              color: '#176B51', 
              fontWeight: '600',
              textDecoration: 'none',
            }}>Back to Login</a>
          </p>
        </div>
      </div>
    </div>
  );
}