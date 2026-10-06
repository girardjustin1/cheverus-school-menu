import { createTheme } from '@mui/material/styles';
export const theme = createTheme({
  palette: { primary: { main: '#244b3e', light: '#e7eee7', dark: '#163428' }, secondary: { main: '#ead889' }, background: { default: '#faf9f5', paper: '#ffffff' }, text: { primary: '#263d32', secondary: '#626b63' }, success: { main: '#37664c' }, warning: { main: '#8c5d1c' }, error: { main: '#b13e35' }, divider: '#e4e6de' },
  typography: { fontFamily: '"DM Sans", sans-serif', h1: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500, fontSize: '3.6rem', lineHeight: 1.1 }, h2: { fontFamily: '"Fraunces", Georgia, serif', fontWeight: 500, fontSize: '2rem' }, h3: { fontWeight: 700, fontSize: '1.25rem' }, h4: { fontWeight: 700, fontSize: '1.1rem' }, button: { textTransform: 'none', fontWeight: 600 }, body1: { lineHeight: 1.65 }, body2: { lineHeight: 1.55 } },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { minHeight: 46, paddingInline: 20, borderRadius: 10 }, outlined: { borderColor: '#bccabf' } } },
    MuiIconButton: { styleOverrides: { root: { minHeight: 44, minWidth: 44 } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #e4e6de' } } },
    MuiPaper: { defaultProps: { elevation: 0 } },
    MuiChip: { styleOverrides: { root: { fontWeight: 600, fontSize: 11 } } },
    MuiTextField: { defaultProps: { fullWidth: true, variant: 'outlined' } },
    MuiCssBaseline: { styleOverrides: { '*:focus-visible': { outline: '3px solid #a07824', outlineOffset: 4 }, body: { WebkitFontSmoothing: 'antialiased' } } },
  },
});
