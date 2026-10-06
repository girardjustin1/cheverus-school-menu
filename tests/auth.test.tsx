import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/features/auth/LoginPage';
const mocks = vi.hoisted(() => ({ otp: vi.fn() }));
vi.mock('../src/lib/supabase/client', () => ({
  supabase: { auth: { signInWithOtp: mocks.otp } },
  demoEnabled: true,
}));
vi.mock('../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null, loading: false, error: '', enterDemo: vi.fn() }),
}));
beforeEach(() => vi.clearAllMocks());
it('requests a magic link with the callback URL and confirms only after success', async () => {
  mocks.otp.mockResolvedValue({ error: null });
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText('Parent email'), {
    target: { value: 'parent@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
  await waitFor(() => expect(screen.getByText('Check your inbox.')).toBeVisible());
  expect(mocks.otp).toHaveBeenCalledWith({
    email: 'parent@example.com',
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
});
it('does not claim an email was sent when Auth rejects the request', async () => {
  mocks.otp.mockResolvedValue({ error: { message: 'Email rate limit reached' } });
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
  fireEvent.change(screen.getByLabelText('Parent email'), {
    target: { value: 'parent@example.com' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Email me a sign-in link' }));
  await waitFor(() => expect(screen.getByText('Email rate limit reached')).toBeVisible());
  expect(screen.queryByText('Check your inbox.')).not.toBeInTheDocument();
});
