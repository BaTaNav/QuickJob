const result = await auth0.webAuth.authorize({
  scope: 'openid profile email',
  audience: process.env.AUTH0_AUDIENCE
});
