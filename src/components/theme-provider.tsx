'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Theme = 'basic' | 'pro';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isLoaded: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('basic');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    async function loadTheme() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .single();

        if (profile?.is_pro) {
          setTheme('pro');
        }
      }
      setIsLoaded(true);
    }
    loadTheme();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'pro') {
      root.classList.add('dark');
      root.classList.add('pro-mode');
    } else {
      root.classList.remove('dark');
      root.classList.remove('pro-mode');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isLoaded }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
