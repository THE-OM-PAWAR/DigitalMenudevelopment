'use client';

import { useEffect } from 'react';
import { getThemeById, generateThemeCSS } from '@/lib/themes';

interface ThemeProviderProps {
  themeId?: string;
  children: React.ReactNode;
}

export default function ThemeProvider({ themeId = 'modern', children }: ThemeProviderProps) {
  useEffect(() => {
    const theme = getThemeById(themeId);
    const css = generateThemeCSS(theme);
    
    // Remove existing theme styles
    const existingStyle = document.getElementById('theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new theme styles
    const style = document.createElement('style');
    style.id = 'theme-styles';
    style.textContent = css;
    document.head.appendChild(style);
    
    // Apply theme class to body
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${theme.id}`);
    
    return () => {
      const styleElement = document.getElementById('theme-styles');
      if (styleElement) {
        styleElement.remove();
      }
      document.body.className = document.body.className.replace(/theme-\w+/g, '');
    };
  }, [themeId]);

  return <>{children}</>;
}