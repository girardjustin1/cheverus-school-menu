import { StrictMode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../src/features/auth/AuthProvider';
const mocks = vi.hoisted(() => ({ callback: vi.fn(), current: vi.fn(), unsubscribe: vi.fn() }));
vi.mock('@netlify/identity', () => ({
  handleAuthCallback: mocks.callback,
  getUser: mocks.current,
  onAuthChange: () => mocks.unsubscribe,
  logout: vi.fn(),
}));
function Status() {
  const auth = useAuth();
  return (
    <div>
      {auth.loading
        ? 'Loading'
        : `${auth.user?.id || 'signed-out'}:${auth.demo}:${auth.passwordAction}`}
    </div>
  );
}
function show() {
  render(
    <StrictMode>
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <Status />
        </AuthProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});
it('redeems a callback once under StrictMode and leaves a previous demo session', async () => {
  sessionStorage.setItem('cheverus.demo', 'true');
  mocks.callback.mockResolvedValue({ type: 'confirmation', user: { id: 'confirmed' } });
  mocks.current.mockResolvedValue({ id: 'confirmed', email: 'parent@example.com' });
  show();
  await waitFor(() => expect(screen.getByText('confirmed:false:null')).toBeVisible());
  expect(mocks.callback).toHaveBeenCalledOnce();
  expect(sessionStorage.getItem('cheverus.demo')).toBeNull();
});
it('keeps a recovered user in the password-setting flow', async () => {
  mocks.callback.mockResolvedValue({ type: 'recovery', user: { id: 'recovering' } });
  mocks.current.mockResolvedValue({ id: 'recovering', email: 'parent@example.com' });
  show();
  await waitFor(() => expect(screen.getByText('recovering:false:recovery')).toBeVisible());
});
