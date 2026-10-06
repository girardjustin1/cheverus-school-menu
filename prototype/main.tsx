import './browser';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/500.css';
import '../src/theme/global.css';
import { theme } from '../src/theme/theme';
import { PrototypeApp } from './PrototypeApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PrototypeApp />
    </ThemeProvider>
  </StrictMode>,
);
