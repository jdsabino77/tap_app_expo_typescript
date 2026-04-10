/**
 * Brand + UI tokens (aligned with Flutter `lib/core/theme/app_theme.dart`). Change palette here
 * to update the app globally. Splash keeps a full-bleed navy screen; most of the app uses
 * `lightGray` backgrounds and navy/gold accents.
 *
 * - **colors** — primitives and semantic fills (prefer these over inline hex in screens).
 * - **lightTheme / darkTheme** in `theme.ts` — structured typography, spacing, and component tokens.
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
  /** Inputs, cards, list rows (was repeated as #E9ECEF). */
  borderSubtle: "#E9ECEF",
  /** Softer dividers / placeholders (e.g. image thumb borders). */
  borderMuted: "#DEE2E6",
  /** Generic drop shadow (iOS); use with shadowOpacity on each component. */
  shadow: "#000000",
  /** Text on `primaryNavy` full-bleed screens (e.g. splash). */
  onNavyMuted: "rgba(255, 255, 255, 0.85)",
  onNavySubtle: "rgba(255, 255, 255, 0.7)",
  /** Gold wash behind icons on navy (derived from primaryGold rgb 212,175,55). */
  primaryGoldMutedBg: "rgba(212, 175, 55, 0.2)",
  primaryGoldLineAccent: "rgba(212, 175, 55, 0.35)",
  /** Modal / picker scrims */
  overlayScrim: "rgba(0, 0, 0, 0.45)",
  overlayStrong: "rgba(0, 0, 0, 0.55)",
} as const;

export type ThemeColors = typeof colors;
