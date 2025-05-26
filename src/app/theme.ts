'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color tokens
const colors = {
  primary: {
    main: '#2563eb', // blue-600
    light: '#60a5fa', // blue-400
    dark: '#1d4ed8', // blue-700
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#4b5563', // gray-600
    light: '#6b7280', // gray-500
    dark: '#374151', // gray-700
    contrastText: '#ffffff',
  },
  success: {
    main: '#059669', // green-600
    light: '#34d399', // green-400
    dark: '#047857', // green-700
    contrastText: '#ffffff',
  },
  warning: {
    main: '#d97706', // amber-600
    light: '#fbbf24', // amber-400
    dark: '#b45309', // amber-700
    contrastText: '#ffffff',
  },
  error: {
    main: '#dc2626', // red-600
    light: '#f87171', // red-400
    dark: '#b91c1c', // red-700
    contrastText: '#ffffff',
  },
  info: {
    main: '#0284c7', // sky-600
    light: '#38bdf8', // sky-400
    dark: '#0369a1', // sky-700
    contrastText: '#ffffff',
  },
  grey: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

// Create light theme
const lightTheme = createTheme({
  palette: {
    mode: 'light',
    ...colors,
    background: {
      default: '#f3f4f6', // gray-100
      paper: '#ffffff',
    },
    text: {
      primary: '#1f2937', // gray-800
      secondary: '#4b5563', // gray-600
    },
  },
  typography: {
    fontFamily: 'var(--font-roboto)',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.2,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '0.375rem',
          padding: '0.5rem 1rem',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.375rem',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '0.5rem',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '0.5rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '0.25rem',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '0.375rem',
        },
      },
    },
  },
});

// Create dark theme
const darkTheme = createTheme({
  ...lightTheme,
  palette: {
    mode: 'dark',
    ...colors,
    background: {
      default: '#111827', // gray-900
      paper: '#1f2937', // gray-800
    },
    text: {
      primary: '#f9fafb', // gray-50
      secondary: '#e5e7eb', // gray-200
    },
  },
});

// Export both themes
export { lightTheme, darkTheme };

// Export default theme (light theme)
export default lightTheme;