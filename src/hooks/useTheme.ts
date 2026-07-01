import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

/**
 * Reads the theme the inline boot script (in index.html) already applied to
 * <html data-theme>, so React starts in sync and there is no flash. Falls back
 * to the OS preference, then dark.
 */
function readInitialTheme(): Theme {
  const attr = document.documentElement.dataset.theme;
  if (attr === 'light' || attr === 'dark') return attr;
  if (typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

/**
 * Persisted dark/light theme. Applies `data-theme` to the document, stores the
 * choice, and keeps the address-bar theme-color meta in step.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#ffffff' : '#0b0e13');
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggle };
}
