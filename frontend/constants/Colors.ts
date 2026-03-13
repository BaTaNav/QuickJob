// Brand colors used across the app
export const brand = {
  primary: '#176B51',       // Main green - buttons, active states
  primaryLight: '#ECFDF5',  // Light green backgrounds
  primaryDark: '#059669',   // Darker green for text on light bg

  secondary: '#64748B',     // Gray - body text, helpers

  background: '#F8FAFB',    // Page background
  surface: '#FFFFFF',       // Card backgrounds
  surfaceAlt: '#F8FAFC',    // Alternate surface (day sections)

  border: '#E2E8F0',        // Default borders
  borderLight: '#F1F5F9',   // Subtle borders (card footers)

  text: '#1B1B1B',          // Primary text
  textSecondary: '#64748B', // Secondary text
  textMuted: '#94A3B8',     // Muted text
  textHelper: '#7A7F85',    // Helper text

  success: '#10B981',
  successBg: '#DCFCE7',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  error: '#EF4444',
  errorBg: '#FEE2E2',

  tabBg: '#E9ECEF',         // Tab bar background
  filterBg: '#F4F6F7',      // Filter button background
};

// Keep existing light/dark theme too
const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },
};
