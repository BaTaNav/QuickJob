  const jwt = require("jsonwebtoken");

  function signToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,     // "student" | "client" | "admin"
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
  }

  module.exports = { signToken };
