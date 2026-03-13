/**
 * Input Sanitization Middleware
 *
 * Sanitizes all string inputs in the request body to prevent XSS attacks.
 * - Strips HTML tags
 * - Escapes dangerous characters: < > & " '
 * - Trims whitespace from strings
 * - Recursively processes nested objects and arrays
 *
 * Usage:
 *   app.use(express.json());
 *   app.use(sanitize);
 */

/**
 * HTML entity encoding map for XSS prevention
 */
const ENTITY_MAP = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escape HTML special characters
 *
 * @param {string} string - Input string to escape
 * @returns {string} Escaped string
 */
function escapeHtml(string) {
  return String(string).replace(/[<>&"']/g, (char) => ENTITY_MAP[char] || char);
}

/**
 * Strip HTML tags from a string
 *
 * @param {string} string - Input string
 * @returns {string} String without HTML tags
 */
function stripHtmlTags(string) {
  return String(string)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags first
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
    .replace(/<[^>]+>/g, ''); // Remove all other HTML tags
}

/**
 * Sanitize a single value
 * - If string: strip tags, escape special chars, trim
 * - If object/array: recursively sanitize
 * - Otherwise: return as-is
 *
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
function sanitizeValue(value) {
  if (typeof value === 'string') {
    return escapeHtml(stripHtmlTags(value)).trim();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value !== null && typeof value === 'object') {
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }

  return value;
}

/**
 * Express middleware for sanitizing request body
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function sanitize(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeValue(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }

    next();
  } catch (error) {
    // Log error but don't block request
    console.error('Sanitization error:', error.message);
    next();
  }
}

module.exports = sanitize;
