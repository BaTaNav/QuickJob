const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");

// ✅ FIX for IPv6: use ipKeyGenerator from express-rate-limit
const { ipKeyGenerator } = require("express-rate-limit");

function keyByUserOrIp(req) {
  if (req.user?.sub) return `user:${req.user.sub}`;
  return `ip:${ipKeyGenerator(req)}`; // ✅ IPv6-safe
}

// 🔐 Login brute-force protection
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req), // ✅ IPv6-safe
});

// 🌍 Global basic protection
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  message: { error: "Too many requests. Slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req), // ✅ IPv6-safe
});

// 👤 Authenticated limiter
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  keyGenerator: keyByUserOrIp,
  message: { error: "Rate limit exceeded. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🛑 Strict limiter for creating jobs
const createJobLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  keyGenerator: keyByUserOrIp,
  message: { error: "Too many job requests. Try again in a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🐌 Slow down spam (also needs IPv6-safe keyGenerator)
const slowDownAuth = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: () => 250,
  keyGenerator: (req) => keyByUserOrIp(req), // ✅ IPv6-safe
});

module.exports = {
  loginLimiter,
  publicApiLimiter,
  authLimiter,
  createJobLimiter,
  slowDownAuth,
};
