import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f5f5f5', // Off-white for primary elements
    },
    secondary: {
      main: '#cccccc', // Light gray for secondary elements
    },
    background: {
      default: '#333333', // Charcoal background
      paper: '#f5f5f5', // Off-white for cards/papers
    },
    text: {
      primary: '#333333', // Dark text for light backgrounds
      secondary: '#666666', // Gray text
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 500,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #2c2c2c 0%, #333333 50%, #404040 100%)',
        },
      },
    },
  },
});

export default theme; 