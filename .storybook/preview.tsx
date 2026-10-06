import '../prototype/browser';
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
    (Story, context) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div
          style={
            context.parameters.fullPage ? { minHeight: '100dvh' } : { maxWidth: 1060, padding: 24 }
          }
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    options: {
      storySort: {
        order: [
          'Prototype',
          'Foundations',
          'Navigation',
          'Day',
          'Meals',
          'EDP',
          'Selections',
          'Email',
          'Forms',
          'Admin',
          'Feedback',
        ],
      },
    },
    backgrounds: { options: { ivory: { name: 'Ivory', value: '#faf9f5' } } },
  },
};
export default preview;
