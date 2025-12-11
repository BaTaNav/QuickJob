import Auth0 from 'react-native-auth0';

export const auth0 = new Auth0({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
});
