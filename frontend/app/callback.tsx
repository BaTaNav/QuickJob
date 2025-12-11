import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import Auth0 from 'react-native-auth0';
import { jwtDecode } from 'jwt-decode'; // Fix 1: Correcte named import

// *** VUL HIER JOUW CORRECTE REDIRECT URI IN ***
const REDIRECT_URI = 'http://localhost:8081/callback'; 
// *** DE AUTH0 VERIFIER SLEUTEL DIE IN DE BROWSER WORDT GEBRUIKT ***
const PKCE_VERIFIER_KEY = 'a0.code_verifier'; // Veelvoorkomende standaard bij Auth0 SDK's

const auth0 = new Auth0({
  domain: process.env.EXPO_PUBLIC_AUTH0_DOMAIN || '',
  clientId: process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID || '',
});

// Functie om de code verifier op te halen uit de browser opslag
const getCodeVerifier = (): string | null => {
    // Gebruik window.sessionStorage of window.localStorage
    // Afhankelijk van de Expo/Web omgeving. sessionStorage is veiliger en logischer.
    return window.sessionStorage.getItem(PKCE_VERIFIER_KEY);
};

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
          console.log('Authorization code received:', code);
          
          // =========================================================
          // CODE UITWISSELEN VOOR TOKENS (INCL. PKCE FIX)
          // =========================================================
            const verifier = getCodeVerifier();
            
            if (!verifier) {
                throw new Error("PKCE Code Verifier ontbreekt. Kan authenticatie niet voltooien.");
            }
            
            const credentials = await auth0.auth.exchange({
                code: code,
                redirectUri: REDIRECT_URI,
                verifier: verifier, // FIX 2: De vereiste verifier is nu aanwezig
            });

            // Optioneel: Verwijder de verifier na gebruik (goede beveiligingspraktijk)
            window.sessionStorage.removeItem(PKCE_VERIFIER_KEY); 

            // =========================================================
            // ROL LEZEN EN ROUTEREN
            // =========================================================
            const idToken = credentials.idToken;
            const namespace = "https://localhost:8081/"; // Gebruik de namespace uit je Auth0 Action
            
            const decodedToken = jwtDecode(idToken) as any;
            const userRole = decodedToken[`${namespace}role`];
            
            console.log("Tokens succesvol ontvangen en rol gelezen:", userRole);
            
            // Tokens en rol opslaan in globale state (dit moet je zelf implementeren!)
            // saveUserCredentials(credentials, userRole);

            // Routeren op basis van de rol (gebruik 'as any' voor Expo Router type safety)
            if (userRole === 'student') {
                router.replace('/Student/Dashboard' as any); 
            } else if (userRole === 'client') {
                router.replace('/Client/Dashboard' as any); 
            } else {
                console.warn('Onbekende gebruikersrol, doorsturen naar login.');
                router.replace('/Login' as any);
            }
            
        } else {
          throw new Error('No authorization code received');
        }
        
      } catch (err) {
        console.error('Callback error:', err);
        setError(err instanceof Error ? err.message : 'Authentication failed');
        setTimeout(() => {
          router.replace('/Login' as any);
        }, 3000);
      }
    };

    handleCallback();
  }, []);

  // ... (rest van de render code blijft hetzelfde) ...
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