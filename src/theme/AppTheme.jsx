import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CssBaseline } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { entaTheme } from './entaTheme';

const ThemeModeContext = createContext({ mode: 'light', toggleMode: () => {} });

export const useThemeMode = () => useContext(ThemeModeContext);

const getInitialMode = () => {
  try {
    return localStorage.getItem('enta-theme-mode') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

export const AppTheme = ({ children }) => {
  const [mode, setMode] = useState(getInitialMode);
  const theme = useMemo(() => createTheme(entaTheme, {
    palette: {
      mode,
      background: mode === 'dark'
        ? { default: '#121212', paper: '#1e1e1e' }
        : { default: '#fafafa', paper: '#ffffff' },
      text: mode === 'dark'
        ? { primary: '#f5f5f5', secondary: '#c2c2c2' }
        : { primary: 'rgba(0, 0, 0, 0.87)', secondary: 'rgba(0, 0, 0, 0.6)' },
    },
  }), [mode]);

  useEffect(() => {
    try {
      localStorage.setItem('enta-theme-mode', mode);
    } catch {
      // The current session still keeps the selected mode if storage is unavailable.
    }
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  const toggleMode = () => setMode((currentMode) => currentMode === 'dark' ? 'light' : 'dark');

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};
