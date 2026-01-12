const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const slowDown = require("express-slow-down");

function keyByUserOrIp(req) {
  return req.user?.sub ? `user:${req.user.sub}` : ipKeyGenerator(req);
}

// ✅ Admin limiter
const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  keyGenerator: keyByUserOrIp,
  message: { error: "Too many admin requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Admin slowdown
const slowDownAdmin = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 15,
  delayMs: () =>  ,
  keyGenerator: keyByUserOrIp,
});

// ✅ Login limiter (per email)
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10, // blocks on 11th (set 9 to block on 10th)
  keyGenerator: (req) => {
    const email = (req.body?.email || "").toString().trim().toLowerCase();
    return `login:${email}`;
  },
  handler: (req, res) => {
    return res.status(429).json({ error: "Too many login attempts. Try again later." });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🌍 Global basic DDoS protection
const publicApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 120,
  keyGenerator: ipKeyGenerator, // ✅ FIXED (was ipKeyGenerator)
  message: { error: "Too many requests. Slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// 👤 Authenticated user limiter
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

// 🐌 Slow down spam
const slowDownAuth = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: () => 250,
  keyGenerator: keyByUserOrIp,
});

module.exports = {
  loginLimiter,
  publicApiLimiter,
  authLimiter,
  createJobLimiter,
  slowDownAuth,
  adminLimiter,
  slowDownAdmin,
};
