import { useEffect, useState } from 'react';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { AppRoutes } from '../src/app/App';
import { EmailPreview } from '../src/features/email/EmailPreview';
import type { EmailAction } from '../src/features/email/actions';
import { AuthProvider } from './mocks/auth';
import { prototypeEmailEvent } from './mocks/email-actions';
import { resetPrototype, type PrototypeScenario } from './mocks/repository';

const pagesMode = import.meta.env.BASE_URL !== '/';
const PrototypeRouter = pagesMode ? HashRouter : BrowserRouter;

interface Screen {
  label: string;
  description: string;
  path: string;
  scenario: PrototypeScenario;
  admin?: boolean;
}

const screens: Screen[] = [
  {
    label: 'Parent workflow',
    description: 'Choose meals and plan Extended Day',
    path: '/menu?date=2026-10-06',
    scenario: 'daily',
  },
  {
    label: 'Month review',
    description: 'A week of sample selections',
    path: '/selections',
    scenario: 'review',
  },
  {
    label: 'Email preview',
    description: 'A completed month ready to review',
    path: '/email',
    scenario: 'email',
  },
  {
    label: 'Family setup',
    description: 'Edit sample parent and child details',
    path: '/profile',
    scenario: 'daily',
  },
  {
    label: 'First child',
    description: 'Try the empty family experience',
    path: '/profile',
    scenario: 'empty-family',
  },
  {
    label: 'School admin',
    description: 'Explore editing and publishing sample menus',
    path: '/admin/menus',
    scenario: 'daily',
    admin: true,
  },
  {
    label: 'Sign in',
    description: 'Simulated sign-in; any sample credentials',
    path: '/login',
    scenario: 'daily',
  },
  {
    label: 'No school',
    description: 'October 12 has no school services',
    path: '/menu?date=2026-10-12',
    scenario: 'daily',
  },
  {
    label: 'Save interruption',
    description: 'Try recovering a simulated save failure',
    path: '/menu?date=2026-10-06',
    scenario: 'save-error',
  },
];

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false } },
  });
}

export function PrototypeApp() {
  const [session, setSession] = useState(() => ({ key: 0, client: createClient() }));
  const [toolsOpen, setToolsOpen] = useState(false);
  const [email, setEmail] = useState<EmailAction | null>(null);

  useEffect(() => {
    const preview = (event: Event) => setEmail((event as CustomEvent<EmailAction>).detail);
    window.addEventListener(prototypeEmailEvent, preview);
    return () => window.removeEventListener(prototypeEmailEvent, preview);
  }, []);

  const explore = (screen: Screen) => {
    session.client.clear();
    resetPrototype(screen.scenario, screen.admin);
    window.history.replaceState(
      null,
      '',
      pagesMode ? `${import.meta.env.BASE_URL}#${screen.path}` : screen.path,
    );
    setSession((previous) => ({ key: previous.key + 1, client: createClient() }));
    setToolsOpen(false);
    setEmail(null);
    window.scrollTo(0, 0);
  };

  return (
    <>
      <Box
        className="no-print"
        sx={{
          bgcolor: '#e7eadc',
          borderBottom: '1px solid #ccd5ca',
          px: 2,
          py: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
          Experience prototype · Sample data
        </Typography>
        <Button
          size="small"
          startIcon={<TuneOutlinedIcon sx={{ fontSize: 16 }} />}
          onClick={() => setToolsOpen(true)}
          sx={{ fontSize: 11, whiteSpace: 'nowrap' }}
        >
          Prototype tools
        </Button>
      </Box>
      <QueryClientProvider key={session.key} client={session.client}>
        <PrototypeRouter>
          <AuthProvider
            signedIn={
              (pagesMode
                ? window.location.hash.slice(1).split('?')[0]
                : window.location.pathname) !== '/login'
            }
          >
            <AppRoutes />
          </AuthProvider>
        </PrototypeRouter>
      </QueryClientProvider>
      <Drawer anchor="right" open={toolsOpen} onClose={() => setToolsOpen(false)}>
        <Box
          sx={{ width: 320, maxWidth: '100vw', p: 2, pb: 'max(16px, env(safe-area-inset-bottom))' }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
          >
            <Typography variant="h3">Explore the experience</Typography>
            <Button size="small" onClick={() => setToolsOpen(false)}>
              Close
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Everything here is sample data. Choices stay in this browser. Loading a screen replaces
            the current sample plans.
          </Typography>
          <Divider />
          <List>
            {screens.map((screen) => (
              <ListItemButton
                key={screen.label}
                onClick={() => explore(screen)}
                sx={{ borderRadius: 2 }}
              >
                <ListItemText
                  primary={screen.label}
                  secondary={screen.description}
                  slotProps={{
                    primary: { sx: { fontSize: 14, fontWeight: 600 } },
                    secondary: { sx: { fontSize: 12 } },
                  }}
                />
              </ListItemButton>
            ))}
          </List>
          <Divider sx={{ mb: 2 }} />
          <Button fullWidth variant="outlined" onClick={() => explore(screens[0])}>
            Reset sample data
          </Button>
        </Box>
      </Drawer>
      <Dialog open={!!email} onClose={() => setEmail(null)} fullWidth maxWidth="md">
        <DialogTitle>Email action preview</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Review the prepared message here. This prototype keeps the email inside the app.
          </Typography>
          {email && <EmailPreview {...email} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmail(null)}>Return to prototype</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
