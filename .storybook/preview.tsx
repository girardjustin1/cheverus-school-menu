import type { Preview } from '@storybook/react-vite';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../src/theme/theme';
import '../src/theme/global.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/500.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div style={{ maxWidth: 1060, padding: 24 }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    backgrounds: { options: { ivory: { name: 'Ivory', value: '#faf9f5' } } },
  },
};
export default preview;
