/**
 * Environment Configuration
 *
 * Centralizes all environment-dependent values.
 * In production, these should come from environment variables or a build config.
 *
 * Usage:
 *   import { ENV } from '@/config/env';
 *   fetch(`${ENV.API_BASE_URL}/auth/login`, ...);
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Read from Expo config (app.json extra, or EAS env vars)
const expoExtra = Constants.expoConfig?.extra ?? {};

// Determine API URL:
// 1. Expo config → 2. Environment variable → 3. Platform-aware default
function getApiBaseUrl(): string {
  // From Expo extra config (set via app.json or app.config.js)
  if (expoExtra.API_BASE_URL) {
    return expoExtra.API_BASE_URL;
  }

  // Platform-aware fallback for development
  if (__DEV__) {
    return Platform.OS === 'web'
      ? 'http://localhost:3000'
      : 'http://192.168.129.7:3000'; // Local network IP for mobile
  }

  // Production default (replace with your production API URL)
  return 'https://api.quickjob.be';
}

export const ENV = {
  /** Backend API base URL (no trailing slash) */
  API_BASE_URL: getApiBaseUrl(),

  /** Is this a development build? */
  IS_DEV: __DEV__,

  /** App version string */
  APP_VERSION: Constants.expoConfig?.version ?? '1.0.0',

  /** Maximum image upload size in bytes (5 MB) */
  MAX_IMAGE_SIZE: 5 * 1024 * 1024,

  /** Supported image MIME types */
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export default ENV;
