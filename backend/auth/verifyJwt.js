const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fallback-dev-secret";

/**
 * JWT verification middleware
 * Extracts and validates Bearer token, attaches user info to req.user
 */
module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];

  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({ error: "Invalid authentication token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Ensure required fields exist
    if (!decoded.id || !decoded.role) {
      return res.status(401).json({ error: "Malformed token" });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
