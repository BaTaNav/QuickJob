/**
 * Validation utility functions
 * Pure functions for input validation with no external dependencies
 * Returns objects with { valid: boolean, error?: string } format
 */

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email must be a non-empty string' };
  }

  // RFC 5322 simplified pattern for practical email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email is too long (max 254 characters)' };
  }

  const [localPart, domain] = email.split('@');

  if (localPart.length > 64) {
    return { valid: false, error: 'Local part of email is too long (max 64 characters)' };
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { valid: false, error: 'Invalid email format (dot placement)' };
  }

  return { valid: true };
}

/**
 * Validates password strength
 * Requirements: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number
 * @param {string} password - Password to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password must be a non-empty string' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validates phone number (Belgian format or general international)
 * Accepts: +32... format or general international patterns
 * @param {string} phone - Phone number to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be a non-empty string' };
  }

  // Remove spaces, hyphens, and dots for validation
  const cleaned = phone.replace(/[\s\-\.]/g, '');

  // Belgian format: +32 followed by 8-9 digits (without leading 0)
  const belgianRegex = /^\+32\d{8,9}$/;

  // General international format: + followed by 7-15 digits
  const internationalRegex = /^\+\d{7,15}$/;

  if (belgianRegex.test(cleaned)) {
    return { valid: true };
  }

  if (internationalRegex.test(cleaned)) {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid phone number format. Use +32... for Belgian numbers or international format +...' };
}

/**
 * Validates Belgian IBAN (BE + 2 check digits + 12 digits)
 * Uses mod-97 IBAN check algorithm
 * @param {string} iban - IBAN to validate
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateIBAN(iban) {
  if (!iban || typeof iban !== 'string') {
    return { valid: false, error: 'IBAN must be a non-empty string' };
  }

  // Remove spaces and convert to uppercase
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Belgian IBAN format: BE + 2 check digits + 12 digits
  const belgianIBANRegex = /^BE\d{14}$/;

  if (!belgianIBANRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid Belgian IBAN format. Expected: BE followed by 14 digits' };
  }

  // Validate IBAN check digits using mod-97 algorithm
  // Move first 4 characters to the end
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  let numericIBAN = '';
  for (let i = 0; i < rearranged.length; i++) {
    const char = rearranged[i];
    if (char >= '0' && char <= '9') {
      numericIBAN += char;
    } else {
      numericIBAN += (char.charCodeAt(0) - 55).toString();
    }
  }

  // Calculate mod 97
  let remainder = 0;
  for (let i = 0; i < numericIBAN.length; i++) {
    remainder = (remainder * 10 + parseInt(numericIBAN[i])) % 97;
  }

  if (remainder !== 1) {
    return { valid: false, error: 'Invalid IBAN check digits' };
  }

  return { valid: true };
}

/**
 * Validates date of birth
 * Must be a valid date, person must be at least 15 years old and under 100 years old
 * @param {string|Date} dob - Date of birth (ISO string or Date object)
 * @returns {Object} { valid: boolean, error?: string }
 */
function validateDateOfBirth(dob) {
  if (!dob) {
    return { valid: false, error: 'Date of birth is required' };
  }

  let dobDate;

  // Handle both string and Date inputs
  if (typeof dob === 'string') {
    dobDate = new Date(dob);
  } else if (dob instanceof Date) {
    dobDate = dob;
  } else {
    return { valid: false, error: 'Date of birth must be a string or Date object' };
  }

  // Check if date is valid
  if (isNaN(dobDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const monthDiff = today.getMonth() - dobDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dobDate.getDate())) {
    age--;
  }

  // Check if person is at least 15 years old
  if (age < 15) {
    return { valid: false, error: 'Person must be at least 15 years old' };
  }

  // Check if person is under 100 years old
  if (age >= 100) {
    return { valid: false, error: 'Person must be under 100 years old' };
  }

  // Check if date is not in the future
  if (dobDate > today) {
    return { valid: false, error: 'Date of birth cannot be in the future' };
  }

  return { valid: true };
}

/**
 * Sanitizes a string by trimming, escaping HTML entities, and removing null bytes
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // Trim whitespace
  let sanitized = str.trim();

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Escape HTML entities
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return sanitized;
}

// Export all validation functions
module.exports = {
  validateEmail,
  validatePassword,
  validatePhone,
  validateIBAN,
  validateDateOfBirth,
  sanitizeString
};
