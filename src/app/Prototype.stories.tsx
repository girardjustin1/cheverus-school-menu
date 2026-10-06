import { useState, type MouseEvent } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { AppRoutes } from './App';
import { AuthProvider } from '../../.storybook/mocks/auth';
import { resetPrototype, type PrototypeScenario } from '../../.storybook/mocks/repository';

interface Props {
  startAt: string;
  scenario: PrototypeScenario;
  admin: boolean;
}
function Prototype({ startAt, scenario, admin }: Props) {
  const [session, setSession] = useState(() => {
    resetPrototype(scenario, admin);
    return {
      key: 0,
      client: new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
        },
      }),
    };
  });
  const [emailOpen, setEmailOpen] = useState(false);
  const reset = () => {
    session.client.clear();
    resetPrototype(scenario, admin);
    setSession({
      key: session.key + 1,
      client: new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: Infinity, refetchOnWindowFocus: false },
        },
      }),
    });
  };
  const previewEmail = (event: MouseEvent<HTMLDivElement>) => {
    const button = (event.target as HTMLElement).closest('button');
    if (button?.textContent?.trim() !== 'Open Email' || button.disabled) return;
    event.preventDefault();
    event.stopPropagation();
    setEmailOpen(true);
  };
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 2,
          py: 0.5,
          bgcolor: '#e7eadc',
          borderBottom: '1px solid #ccd5ca',
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 600 }}>GUI prototype · Sample data</Typography>
        <Button size="small" onClick={reset}>
          Reset prototype
        </Button>
      </Box>
      <Box onClickCapture={previewEmail}>
        <QueryClientProvider key={session.key} client={session.client}>
          <MemoryRouter initialEntries={[startAt]}>
            <AuthProvider signedIn={startAt !== '/login'}>
              <AppRoutes />
            </AuthProvider>
          </MemoryRouter>
        </QueryClientProvider>
      </Box>
      <Dialog open={emailOpen} onClose={() => setEmailOpen(false)}>
        <DialogTitle>Email action preview</DialogTitle>
        <DialogContent>
          <Typography>
            This is where your usual email app would open with the recipient, subject, and
            selections from the preview. You can keep exploring the GUI here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailOpen(false)}>Return to prototype</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

const meta = {
  title: 'Prototype/Cheverus app',
  component: Prototype,
  parameters: { fullPage: true, layout: 'fullscreen', controls: { disable: true } },
  args: { startAt: '/menu?date=2026-10-06', scenario: 'daily', admin: false },
} satisfies Meta<typeof Prototype>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ParentWorkflow: Story = {};
export const MonthReview: Story = { args: { startAt: '/selections', scenario: 'review' } };
export const EmailPreview: Story = { args: { startAt: '/email', scenario: 'email' } };
export const FamilySetup: Story = { args: { startAt: '/profile' } };
export const FirstChild: Story = { args: { scenario: 'empty-family' } };
export const SchoolAdmin: Story = { args: { startAt: '/admin/menus', admin: true } };
export const SignIn: Story = { args: { startAt: '/login' } };
export const NoSchool: Story = { args: { startAt: '/menu?date=2026-10-12' } };
export const SaveFailure: Story = { args: { scenario: 'save-error' } };
export const Phone: Story = {
  render: () => (
    <Box sx={{ p: 3, display: 'grid', justifyItems: 'center', gap: 2 }}>
      <Alert severity="info" sx={{ maxWidth: 600 }}>
        Interactive 390 px phone preview. Try lunch, breakfast, EDP, then use the bottom navigation
        to review and prepare an email.
      </Alert>
      <Box
        component="iframe"
        title="Cheverus interactive phone prototype"
        src="./iframe.html?id=prototype-cheverus-app--parent-workflow&viewMode=story"
        sx={{
          width: 402,
          maxWidth: '100%',
          height: 'min(844px, calc(100dvh - 130px))',
          minHeight: 440,
          border: '6px solid #203e2b',
          borderRadius: 5,
          bgcolor: '#faf9f5',
        }}
      />
    </Box>
  ),
};
