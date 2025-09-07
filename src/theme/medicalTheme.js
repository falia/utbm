import { createTheme } from '@mui/material/styles';

export const medicalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2E7D8A', // Bleu médical professionnel
      light: '#5FADBD',
      dark: '#1C5B66',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#4A90A4', // Bleu plus clair pour les accents
      light: '#7BB3C7',
      dark: '#2F6B7D',
      contrastText: '#ffffff',
    },
    error: {
      main: '#D32F2F', // Rouge pour les alertes médicales
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#F57C00', // Orange pour les avertissements
      light: '#FFB74D',
      dark: '#E65100',
    },
    success: {
      main: '#388E3C', // Vert médical pour les résultats positifs
      light: '#66BB6A',
      dark: '#2E7D32',
    },
    info: {
      main: '#1976D2', // Bleu information
      light: '#42A5F5',
      dark: '#1565C0',
    },
    background: {
      default: '#F8FAFB', // Fond très clair, propre
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A1A', // Texte principal sombre pour la lisibilité
      secondary: '#5A6C7D', // Texte secondaire
    },
    divider: '#E0E4E7',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#1A1A1A',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: '#1A1A1A',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: '#1A1A1A',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#1A1A1A',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#5A6C7D',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12, // Coins arrondis modernes
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 24px',
          fontSize: '0.95rem',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(46, 125, 138, 0.15)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #2E7D8A 0%, #4A90A4 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1C5B66 0%, #2F6B7D 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          border: '1px solid #E0E4E7',
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
        },
        elevation2: {
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #E0E4E7',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#2E7D8A',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '0.95rem',
        },
        body: {
          fontSize: '0.9rem',
          padding: '16px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: '#F1F8E9',
          borderColor: '#C8E6C9',
        },
        standardError: {
          backgroundColor: '#FFEBEE',
          borderColor: '#FFCDD2',
        },
        standardWarning: {
          backgroundColor: '#FFF8E1',
          borderColor: '#FFECB3',
        },
        standardInfo: {
          backgroundColor: '#E3F2FD',
          borderColor: '#BBDEFB',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.08)',
          borderBottom: '1px solid #E0E4E7',
        },
      },
    },
  },
});

// Thème sombre pour le mode médical professionnel
export const medicalDarkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4A90A4',
      light: '#7BB3C7',
      dark: '#2E7D8A',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#5FADBD',
      light: '#8FCDD9',
      dark: '#4A90A4',
      contrastText: '#000000',
    },
    background: {
      default: '#0A1929', // Bleu marine très sombre
      paper: '#132F4C',
    },
    text: {
      primary: '#E7EBF0',
      secondary: '#B2BAC2',
    },
  },
  typography: medicalTheme.typography,
  shape: medicalTheme.shape,
  components: {
    ...medicalTheme.components,
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#132F4C',
          color: '#E7EBF0',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});