import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Platform, useColorScheme } from "react-native";
import { darkTheme, lightTheme, type AppTheme } from "../theme";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedMode: "light" | "dark";
  theme: AppTheme;
  setThemeMode: (next: ThemeMode) => void;
};

const THEME_MODE_KEY = "tap.theme.mode";
const FALLBACK_MODE: ThemeMode = "system";
const memoryFallback = new Map<string, string>();

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeThemeMode(value: string | null): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") {
    return value;
  }
  return FALLBACK_MODE;
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      }
    } catch {
      /* ignore */
    }
    return memoryFallback.get(key) ?? null;
  }
  return SecureStore.getItemAsync(key);
}

async function storageSet(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      /* ignore */
    }
    memoryFallback.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const osScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>(FALLBACK_MODE);
  const [hasLoadedPreference, setHasLoadedPreference] = useState(false);

  useEffect(() => {
    let alive = true;
    void storageGet(THEME_MODE_KEY)
      .then((stored) => {
        if (!alive) {
          return;
        }
        setThemeModeState(normalizeThemeMode(stored));
      })
      .finally(() => {
        if (alive) {
          setHasLoadedPreference(true);
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  const setThemeMode = (next: ThemeMode) => {
    setThemeModeState(next);
    void storageSet(THEME_MODE_KEY, next);
  };

  const resolvedMode: "light" | "dark" = useMemo(() => {
    if (themeMode === "system") {
      return osScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  }, [osScheme, themeMode]);

  const theme = resolvedMode === "dark" ? darkTheme : lightTheme;

  const value = useMemo(
    () => ({ themeMode, resolvedMode, theme, setThemeMode }),
    [themeMode, resolvedMode, theme],
  );

  if (!hasLoadedPreference) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemePreference(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemePreference must be used within ThemeProvider");
  }
  return ctx;
}
