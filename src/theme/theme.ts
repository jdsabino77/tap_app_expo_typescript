import { colors } from "./tokens";

/** Spacing scale (4pt grid, common RN default). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  input: 8,
  card: 12,
} as const;

/** Flutter `AppTheme.lightTheme` textTheme + input borders. */
export const lightTheme = {
  mode: "light" as const,
  colors: {
    ...colors,
    surface: colors.cleanWhite,
    background: colors.lightGray,
    inputBorder: colors.borderSubtle,
    inputBorderFocused: colors.primaryGold,
  },
  spacing,
  radii,
  typography: {
    headlineLarge: { fontSize: 28, fontWeight: "700" as const, color: colors.textPrimary },
    headlineMedium: { fontSize: 24, fontWeight: "600" as const, color: colors.textPrimary },
    headlineSmall: { fontSize: 20, fontWeight: "500" as const, color: colors.textPrimary },
    bodyLarge: { fontSize: 16, fontWeight: "400" as const, color: colors.textPrimary },
    bodyMedium: { fontSize: 14, fontWeight: "400" as const, color: colors.textSecondary },
    bodySmall: { fontSize: 12, fontWeight: "400" as const, color: colors.textLight },
    appBarTitle: { fontSize: 20, fontWeight: "600" as const, color: colors.cleanWhite },
    button: { fontSize: 16, fontWeight: "600" as const },
    inputHint: { fontSize: 16, fontWeight: "400" as const, color: colors.textLight },
    inputLabel: { fontSize: 16, fontWeight: "400" as const, color: colors.textSecondary },
  },
  component: {
    appBar: { backgroundColor: colors.primaryNavy, foreground: colors.cleanWhite },
    elevatedButton: {
      backgroundColor: colors.primaryGold,
      foreground: colors.primaryNavy,
      paddingH: 24,
      paddingV: 12,
    },
    outlinedButton: {
      foreground: colors.primaryNavy,
      borderColor: colors.primaryNavy,
      borderWidth: 1,
      paddingH: 24,
      paddingV: 12,
    },
    textButton: { foreground: colors.primaryGold, paddingH: 16, paddingV: 8 },
    fab: { backgroundColor: colors.primaryGold, foreground: colors.primaryNavy },
    card: {
      backgroundColor: colors.cleanWhite,
      elevation: 2,
      marginH: 16,
      marginV: 8,
    },
    bottomNav: {
      background: colors.cleanWhite,
      selected: colors.primaryNavy,
      unselected: colors.textLight,
    },
  },
} as const;

/** Flutter `AppTheme.darkTheme` (subset used in migration). */
export const darkTheme = {
  mode: "dark" as const,
  colors: {
    ...colors,
    surface: "#1E1E1E",
    background: "#121212",
    textPrimary: colors.cleanWhite,
    textSecondary: "#B0B0B0",
    textLight: "#808080",
    inputBorder: "#3A3A3A",
    inputBorderFocused: colors.primaryGold,
  },
  spacing,
  radii,
  typography: {
    headlineLarge: { fontSize: 28, fontWeight: "700" as const, color: colors.cleanWhite },
    headlineMedium: { fontSize: 24, fontWeight: "600" as const, color: colors.cleanWhite },
    headlineSmall: { fontSize: 20, fontWeight: "500" as const, color: colors.cleanWhite },
    bodyLarge: { fontSize: 16, fontWeight: "400" as const, color: colors.cleanWhite },
    bodyMedium: { fontSize: 14, fontWeight: "400" as const, color: "#B0B0B0" },
    bodySmall: { fontSize: 12, fontWeight: "400" as const, color: "#808080" },
    appBarTitle: { fontSize: 20, fontWeight: "600" as const, color: colors.cleanWhite },
    button: { fontSize: 16, fontWeight: "600" as const },
    inputHint: { fontSize: 16, fontWeight: "400" as const, color: "#808080" },
    inputLabel: { fontSize: 16, fontWeight: "400" as const, color: "#B0B0B0" },
  },
  component: {
    appBar: { backgroundColor: "#1E1E1E", foreground: colors.cleanWhite },
    elevatedButton: {
      backgroundColor: colors.primaryGold,
      foreground: colors.primaryNavy,
      paddingH: 24,
      paddingV: 12,
    },
    outlinedButton: {
      foreground: colors.primaryGold,
      borderColor: colors.primaryGold,
      borderWidth: 1,
      paddingH: 24,
      paddingV: 12,
    },
    textButton: { foreground: colors.primaryGold, paddingH: 16, paddingV: 8 },
    fab: { backgroundColor: colors.primaryGold, foreground: colors.primaryNavy },
    card: {
      backgroundColor: "#1E1E1E",
      elevation: 2,
      marginH: 16,
      marginV: 8,
    },
    bottomNav: {
      background: "#1E1E1E",
      selected: colors.primaryGold,
      unselected: "#808080",
    },
  },
} as const;

/**
 * Typography presets for full-bleed navy screens (e.g. splash). Spread into StyleSheets;
 * layout (margins) stays local to each screen.
 */
export const textOnNavy = {
  heroTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: colors.cleanWhite,
    textAlign: "center" as const,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "500" as const,
    color: colors.primaryGold,
    textAlign: "center" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.onNavyMuted,
    textAlign: "center" as const,
  },
  featureTitle: { fontSize: 16, fontWeight: "700" as const, color: colors.cleanWhite },
  featureSub: { fontSize: 14, lineHeight: 20, color: colors.onNavySubtle },
} as const;

export type AppTheme = typeof lightTheme;
