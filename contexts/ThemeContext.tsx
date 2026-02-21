
import React, { createContext, useContext, useState, useEffect } from 'react';

interface Theme {
  primary: string;
  primaryLight: string;
  secondary: string;
  text: string;
}

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Partial<Theme>) => void;
  resetTheme: () => void;
}

const defaultTheme: Theme = {
  primary: '#7e22ce', // purple-700
  primaryLight: '#faf5ff', // purple-50
  secondary: '#581c87', // purple-900 (used in login bg)
  text: '#111827', // gray-900
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('arcontrol_theme');
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    // Set CSS variables for Tailwind arbitrary values
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-primary-light', theme.primaryLight);
    root.style.setProperty('--theme-secondary', theme.secondary);
    root.style.setProperty('--theme-text', theme.text);
    
    localStorage.setItem('arcontrol_theme', JSON.stringify(theme));
  }, [theme]);

  const updateTheme = (newTheme: Partial<Theme>) => {
    setTheme(prev => ({ ...prev, ...newTheme }));
  };

  const resetTheme = () => {
    setTheme(defaultTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
