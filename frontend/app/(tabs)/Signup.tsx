import React, { useState } from 'react'; 

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
  

  const inputStyle = {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '1rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };

  const buttonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#333', 
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    marginTop: '0.5rem',
  };
    

  const clientButtonStyle = {
    width: '100%',
    padding: '1rem',
    backgroundColor: '#333', 
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
  };


  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '2rem',
      backgroundColor: '#f5f5f5' 
    }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>QuickJob</h1> 
      </div>
      

      <div style={{
        width: '100%',
        maxWidth: '450px',
        padding: '3rem',
        backgroundColor: '#e0e0e0',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'normal', textAlign: 'center', marginBottom: '1.5rem' }}>
          Create student account
        </h2>
        
        
        <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Already have an account? <a href="/Login" style={{ color: '#000', fontWeight: 'bold' }}>Sign in</a>
        </p>

        <form>
          <label htmlFor="fullName" style={{ fontWeight: 'bold', display: 'block' }}>Full Name</label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            style={inputStyle}
            aria-label="Full Name"
          />

          <label htmlFor="email" style={{ fontWeight: 'bold', display: 'block' }}>Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            style={inputStyle}
            aria-label="Email"
          />

          <label htmlFor="password" style={{ fontWeight: 'bold', display: 'block' }}>Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            style={inputStyle}
            aria-label="Password"
          />

          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '-0.75rem', marginBottom: '1rem' }}>
            Must be at least 8 characters with uppercase and number
          </p>


          <label htmlFor="confirmPassword" style={{ fontWeight: 'bold', display: 'block' }}>Confirm password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            style={inputStyle}
            aria-label="Confirm password"
          />

          <button type="submit" style={buttonStyle}>
            Sign In
          </button>
        </form>


        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/forgot-password" style={{ color: '#666', textDecoration: 'none' }}>
            Forgot password?
          </a>
        </div>
      </div>

      
      <div style={{
          marginTop: '1.5rem',
          width: '100%',
          maxWidth: '450px',
          padding: '1.5rem 3rem', 
          backgroundColor: '#e0e0e0', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          textAlign: 'center',
      }}>
          <p style={{ marginBottom: '1rem' }}>
              Liever als client beginnen?
          </p>
          <button 
              style={clientButtonStyle}
              onClick={() => console.log('Naar Client Account registratie')}
          >
              Maak client account
          </button>
      </div>

    </div>
  );
};

export default Signup;