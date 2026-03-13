/**
 * Frontend Validation Utilities
 * Provides email, password, phone, IBAN, and date of birth validation functions
 * Plus formatting utilities for phone and IBAN
 */

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns Error message if invalid, null if valid
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim() === '') {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  if (email.length > 254) {
    return 'Email is too long';
  }

  return null;
}

/**
 * Validates a password with specific requirements
 * Requires: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
 * @param password - The password to validate
 * @returns Specific error message if invalid, null if valid
 */
export function validatePassword(password: string): string | null {
  if (!password) {
    return 'Password is required';
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }

  return null;
}

/**
 * Validates a Belgian phone number
 * Accepts format: +32xxxxxxxxx or 0xxxxxxxxx
 * @param phone - The phone number to validate
 * @returns Error message if invalid, null if valid
 */
export function validatePhone(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }

  // Remove all spaces and hyphens for validation
  const cleanPhone = phone.replace(/[\s\-]/g, '');

  // Check for +32 format (9 digits after +32)
  if (cleanPhone.startsWith('+32')) {
    if (!/^\+32\d{9}$/.test(cleanPhone)) {
      return 'Belgian phone number must have 9 digits after +32';
    }
    return null;
  }

  // Check for 0 format (9 digits after 0)
  if (cleanPhone.startsWith('0')) {
    if (!/^0\d{9}$/.test(cleanPhone)) {
      return 'Belgian phone number must have 9 digits after 0';
    }
    return null;
  }

  return 'Phone number must start with +32 or 0';
}

/**
 * Validates a Belgian IBAN
 * Format: BE + 2 check digits + 12 account digits
 * Includes mod-97 checksum validation
 * @param iban - The IBAN to validate
 * @returns Error message if invalid, null if valid
 */
export function validateIBAN(iban: string): string | null {
  if (!iban || iban.trim() === '') {
    return 'IBAN is required';
  }

  // Remove spaces and convert to uppercase
  const cleanIBAN = iban.replace(/\s/g, '').toUpperCase();

  // Check format: BE + 14 digits (2 check + 12 account)
  if (!/^BE\d{14}$/.test(cleanIBAN)) {
    return 'Belgian IBAN must be in format: BE + 14 digits';
  }

  // Validate using mod-97 algorithm
  if (!validateIBANChecksum(cleanIBAN)) {
    return 'Invalid IBAN checksum';
  }

  return null;
}

/**
 * Validates IBAN checksum using mod-97 algorithm
 * @param iban - The clean IBAN to validate
 * @returns true if valid, false otherwise
 */
function validateIBANChecksum(iban: string): boolean {
  // Move the first 4 characters to the end
  const rearranged = iban.slice(4) + iban.slice(0, 4);

  // Replace letters with numbers (A=10, B=11, ..., Z=35)
  const numeric = rearranged.replace(/[A-Z]/g, (char) => {
    return (char.charCodeAt(0) - 55).toString();
  });

  // Calculate mod 97
  let remainder = numeric;
  for (let i = 0; i < remainder.length; i += 15) {
    const chunk = remainder.slice(0, 15 + i);
    remainder = (parseInt(chunk) % 97).toString() + remainder.slice(chunk.length);
  }

  // Final mod 97 check
  return parseInt(remainder.slice(-15)) % 97 === 1;
}

/**
 * Validates a date of birth in DD/MM/YYYY format
 * Age must be between 15 and 100 years
 * @param dob - Date of birth in DD/MM/YYYY format
 * @returns Error message if invalid, null if valid
 */
export function validateDateOfBirth(dob: string): string | null {
  if (!dob || dob.trim() === '') {
    return 'Date of birth is required';
  }

  // Check format DD/MM/YYYY
  const dobRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const match = dob.match(dobRegex);

  if (!match) {
    return 'Date of birth must be in DD/MM/YYYY format';
  }

  const [, dayStr, monthStr, yearStr] = match;
  const day = parseInt(dayStr);
  const month = parseInt(monthStr);
  const year = parseInt(yearStr);

  // Validate month
  if (month < 1 || month > 12) {
    return 'Month must be between 01 and 12';
  }

  // Validate day (simplified - doesn't account for varying month lengths)
  if (day < 1 || day > 31) {
    return 'Day must be between 01 and 31';
  }

  // Create date object and validate it's a real date
  const dateOfBirth = new Date(year, month - 1, day);
  if (
    dateOfBirth.getFullYear() !== year ||
    dateOfBirth.getMonth() !== month - 1 ||
    dateOfBirth.getDate() !== day
  ) {
    return 'Invalid date';
  }

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() - (month - 1);
  const dayDiff = today.getDate() - day;

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  // Check age range
  if (age < 15) {
    return 'You must be at least 15 years old';
  }

  if (age > 100) {
    return 'Please enter a valid date of birth';
  }

  return null;
}

/**
 * Formats an IBAN with spaces every 4 characters
 * @param input - The IBAN input (spaces and hyphens will be removed)
 * @returns Formatted IBAN (e.g., "BE68 5390 0754 7034")
 */
export function formatIBAN(input: string): string {
  // Remove all spaces and hyphens, convert to uppercase
  const clean = input.replace(/[\s\-]/g, '').toUpperCase();

  // Format with spaces every 4 characters
  return clean.replace(/(.{4})/g, '$1 ').trim();
}

/**
 * Formats a Belgian phone number with spaces
 * Supports both +32 and 0 formats
 * @param input - The phone number input
 * @returns Formatted phone number (e.g., "+32 4 123 45 67" or "0 4 123 45 67")
 */
export function formatPhone(input: string): string {
  // Remove all spaces and hyphens
  let clean = input.replace(/[\s\-]/g, '');

  // Handle +32 format
  if (clean.startsWith('+32')) {
    // Format as: +32 4 123 45 67
    const number = clean.slice(3); // Remove +32
    return `+32 ${number.charAt(0)} ${number.slice(1, 4)} ${number.slice(4, 6)} ${number.slice(6)}`;
  }

  // Handle 0 format
  if (clean.startsWith('0')) {
    // Format as: 0 4 123 45 67
    const number = clean.slice(1); // Remove 0
    return `0 ${clean.charAt(1)} ${number.slice(1, 4)} ${number.slice(4, 6)} ${number.slice(6)}`;
  }

  return clean;
}
