/**
 * YasaLaser brand tokens from Flutter `lib/core/theme/app_theme.dart`.
 * Use with React Native / Expo `StyleSheet` or your design system.
 */
export const colors = {
  primaryNavy: "#1A2332",
  primaryGold: "#D4AF37",
  cleanWhite: "#FFFFFF",
  lightGray: "#F8F9FA",
  successGreen: "#28A745",
  warningOrange: "#FFC107",
  errorRed: "#DC3545",
  infoBlue: "#17A2B8",
  textPrimary: "#1A2332",
  textSecondary: "#6C757D",
  textLight: "#9CA3AF",
} as const;

export type ThemeColors = typeof colors;
