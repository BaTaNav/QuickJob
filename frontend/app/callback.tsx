import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Auth0 from 'react-native-auth0';

const auth0 = new Auth0({
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '',
});

export default function Callback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Parse tokens from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        
        if (code) {
          // Exchange code for tokens
          console.log('Authorization code received:', code);
          
          // Hier kun je de code uitwisselen voor tokens
          // Voor nu redirect we naar dashboard
          router.replace('/Student/Dashboard');
        } else {
          throw new Error('No authorization code received');
        }
        
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => {
          router.replace('/Login');
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFB',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem',
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>Authentication Error</h2>
          <p style={{ color: '#5D6B73' }}>{error}</p>
          <p style={{ color: '#5D6B73', marginTop: '1rem' }}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F8FAFB',
    }}>
      <div style={{
        textAlign: 'center',
        padding: '2rem',
      }}>
        <h2 style={{ color: '#176B51', marginBottom: '1rem' }}>Processing login...</h2>
        <p style={{ color: '#5D6B73' }}>Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
