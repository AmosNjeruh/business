// Business Suite – Theme Context
// Provides light/dark mode toggle; persists to localStorage; applies .dark class to <html>

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("dark");

  // Read preference from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("bs-theme") as Theme | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      }
    } catch {
      // SSR or restricted access — default to dark
    }
  }, []);

  // Apply / remove .dark class on <html> element
  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    try {
      localStorage.setItem("bs-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
