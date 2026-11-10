import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'finanflow_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      // If user OS prefers light, use light; otherwise default to dark
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    } catch {
      // Fallback
    }
    return 'dark';
  });

  const updateDocumentTheme = (currentTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (currentTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.colorScheme = 'dark';
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#0f172a');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#ffffff');
      }
    }
  };

  useEffect(() => {
    updateDocumentTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.warn('Could not save theme to localStorage', e);
    }
  }, [theme]);

  // Listen to OS color scheme changes if user hasn't explicitly set one yet
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (!saved) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
