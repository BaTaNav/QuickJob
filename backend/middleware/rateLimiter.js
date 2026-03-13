/**
 * Rate Limiting Middleware
 *
 * Provides in-memory rate limiting for different endpoint categories.
 * No external dependencies needed - uses pure Node.js Map objects.
 *
 * Usage:
 *   app.post('/auth/login', rateLimiters.authLimiter, loginController);
 *   app.use('/api/', rateLimiters.apiLimiter);
 *   app.post('/auth/reset-password', rateLimiters.strictLimiter, resetController);
 */

/**
 * Internal store for tracking request counts
 * Structure: { clientId: { timestamp: count } }
 */
const requestStore = new Map();

/**
 * Cleanup interval - removes stale entries every 60 seconds
 */
const CLEANUP_INTERVAL = 60000;

/**
 * Start periodic cleanup of expired entries
 */
setInterval(() => {
  const now = Date.now();
  for (const [clientId, timestamps] of requestStore.entries()) {
    const validTimestamps = new Map(
      Array.from(timestamps).filter(([timestamp]) => now - timestamp < 15 * 60 * 1000)
    );
    if (validTimestamps.size === 0) {
      requestStore.delete(clientId);
    } else {
      requestStore.set(clientId, validTimestamps);
    }
  }
}, CLEANUP_INTERVAL);

/**
 * Factory function to create a rate limiter middleware
 *
 * @param {number} maxRequests - Maximum requests allowed within the window
 * @param {number} windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns {Function} Express middleware function
 */
function createRateLimiter(maxRequests, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    // Use IP address as the client identifier
    const clientId = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Initialize storage for this client if not exists
    if (!requestStore.has(clientId)) {
      requestStore.set(clientId, new Map());
    }

    const timestamps = requestStore.get(clientId);

    // Remove timestamps outside the window
    for (const [timestamp] of timestamps) {
      if (timestamp < windowStart) {
        timestamps.delete(timestamp);
      }
    }

    // Get current request count within window
    const requestCount = timestamps.size;

    if (requestCount >= maxRequests) {
      const oldestTimestamp = Math.min(...Array.from(timestamps.keys()));
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

      return res.status(429).json({
        status: 'error',
        message: 'Too many requests. Please try again later.',
        retryAfter: retryAfter,
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Record this request
    timestamps.set(now, true);
    requestStore.set(clientId, timestamps);

    // Add rate limit info to response headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - requestCount - 1,
      'X-RateLimit-Reset': new Date(Math.max(...Array.from(timestamps.keys())) + windowMs).toISOString()
    });

    next();
  };
}

/**
 * Auth Limiter - 10 requests per 15 minutes
 * Used for login and register endpoints to prevent brute force attacks
 */
const authLimiter = createRateLimiter(10, 15 * 60 * 1000);

/**
 * API Limiter - 100 requests per 15 minutes
 * Used for general API endpoints
 */
const apiLimiter = createRateLimiter(100, 15 * 60 * 1000);

/**
 * Strict Limiter - 5 requests per 15 minutes
 * Used for sensitive operations like password reset to prevent abuse
 */
const strictLimiter = createRateLimiter(5, 15 * 60 * 1000);

/**
 * Upload Limiter - 20 requests per 15 minutes
 * Used for file upload endpoints (public but rate-limited to prevent abuse)
 */
const uploadLimiter = createRateLimiter(20, 15 * 60 * 1000);

module.exports = {
  authLimiter,
  apiLimiter,
  strictLimiter,
  uploadLimiter,
  createRateLimiter
};
