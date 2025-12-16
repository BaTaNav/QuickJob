import { router } from 'expo-router';
import React, { useState } from 'react';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    school_name: '',
    field_of_study: '',
    academic_year: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSiteSignup = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!formData.email || !formData.password) {
      setError('Email and password are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    console.log('Registratie via eigen site gestart met:', formData);
    // Voer hier de POST request uit naar je /auth/signup endpoint
    
    // Simulate success
    setTimeout(() => {
      setLoading(false);
      alert('Registration successful! Please login.');
      router.push('/Login');
    }, 1000);
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
    backgroundColor: loading ? '#0e5a3f' : '#176B51',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    marginTop: '0.5rem',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    boxShadow: '0 2px 8px rgba(23, 107, 81, 0.2)',
    opacity: loading ? 0.6 : 1,
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

        <form onSubmit={handleSiteSignup}>
          <label htmlFor="email" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Email *</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            value={formData.email} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="Email"
            disabled={loading}
            required
          />

          <label htmlFor="password" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Password *</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            value={formData.password} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="Password"
            disabled={loading}
            required
          />

          <p style={{ fontSize: '0.8125rem', color: '#5D6B73', marginTop: '-1rem', marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Must be at least 6 characters
          </p>

          <label htmlFor="confirmPassword" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Confirm password *</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            value={formData.confirmPassword} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="Confirm password"
            disabled={loading}
            required
          />

          <label htmlFor="phone" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Phone</label>
          <input 
            type="tel" 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="Phone"
            disabled={loading}
          />

          <label htmlFor="school_name" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>School Name</label>
          <input 
            type="text" 
            id="school_name" 
            name="school_name" 
            placeholder="e.g., KU Leuven"
            value={formData.school_name} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="School Name"
            disabled={loading}
          />

          <label htmlFor="field_of_study" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Field of Study</label>
          <input 
            type="text" 
            id="field_of_study" 
            name="field_of_study" 
            placeholder="e.g., Computer Science"
            value={formData.field_of_study} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="Field of Study"
            disabled={loading}
          />

          <label htmlFor="academic_year" style={{ fontWeight: '600', display: 'block', marginBottom: '0.5rem', color: '#041316', fontSize: '0.875rem' }}>Academic Year</label>
          <input 
            type="text" 
            id="academic_year" 
            name="academic_year" 
            placeholder="e.g., 2024-2025"
            value={formData.academic_year} 
            onChange={handleChange} 
            style={inputStyle} 
            aria-label="Academic Year"
            disabled={loading}
          />

          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <p style={{
                color: '#DC2626',
                fontSize: '14px',
                fontWeight: '500',
                margin: 0
              }}>{error}</p>
            </div>
          )}

          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Student Account'}
          </button>
        </form>

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
