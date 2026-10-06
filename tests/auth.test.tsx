import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/features/auth/LoginPage';
const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  signup: vi.fn(),
  recover: vi.fn(),
  update: vi.fn(),
  invite: vi.fn(),
  finish: vi.fn(),
  action: null as 'recovery' | 'invite' | null,
}));
vi.mock('@netlify/identity', () => ({
  login: mocks.login,
  signup: mocks.signup,
  requestPasswordRecovery: mocks.recover,
  updateUser: mocks.update,
  acceptInvite: mocks.invite,
  getSettings: async () => ({ disableSignup: false, autoconfirm: false, providers: {} }),
}));
vi.mock('../src/lib/api', () => ({ demoEnabled: true }));
vi.mock('../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    error: '',
    enterDemo: vi.fn(),
    passwordAction: mocks.action,
    inviteToken: 'sample-invite',
    finishPasswordAction: mocks.finish,
  }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.action = null;
});
function show() {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}
function email() {
  fireEvent.change(screen.getByLabelText('Parent email'), {
    target: { value: 'parent@example.com' },
  });
}
function password(label = 'Password') {
  fireEvent.change(screen.getByLabelText(label), { target: { value: 'a-long-sample-password' } });
}
it('signs in through Netlify Identity with email and password', async () => {
  mocks.login.mockResolvedValue({ id: 'parent' });
  show();
  email();
  password();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() =>
    expect(mocks.login).toHaveBeenCalledWith('parent@example.com', 'a-long-sample-password'),
  );
});
it('shows a rejected sign-in without claiming success', async () => {
  mocks.login.mockRejectedValue(new Error('Invalid email or password.'));
  show();
  email();
  password();
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
  await waitFor(() => expect(screen.getByText('Invalid email or password.')).toBeVisible());
});
it('requires email confirmation after signup and sends only a display name', async () => {
  mocks.signup.mockResolvedValue({ id: 'parent' });
  show();
  fireEvent.click(await screen.findByRole('button', { name: 'Create an account' }));
  fireEvent.change(screen.getByLabelText('Parent name'), { target: { value: 'Sample parent' } });
  email();
  password();
  fireEvent.click(screen.getByRole('button', { name: 'Create account' }));
  await waitFor(() => expect(screen.getByText(/Check your inbox to confirm/)).toBeVisible());
  expect(mocks.signup).toHaveBeenCalledWith('parent@example.com', 'a-long-sample-password', {
    full_name: 'Sample parent',
  });
});
it('requests recovery with a response that does not reveal whether an account exists', async () => {
  mocks.recover.mockResolvedValue(undefined);
  show();
  fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
  email();
  fireEvent.click(screen.getByRole('button', { name: 'Email me a reset link' }));
  await waitFor(() => expect(screen.getByText(/If that email has an account/)).toBeVisible());
  expect(mocks.recover).toHaveBeenCalledWith('parent@example.com');
});
it('finishes a recovered session only after the new password is saved', async () => {
  mocks.action = 'recovery';
  mocks.update.mockResolvedValue({ id: 'parent' });
  show();
  password('New password');
  fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
  await waitFor(() => expect(mocks.finish).toHaveBeenCalledOnce());
  expect(mocks.update).toHaveBeenCalledWith({ password: 'a-long-sample-password' });
});
it('accepts an invitation with its token and chosen password', async () => {
  mocks.action = 'invite';
  mocks.invite.mockResolvedValue({ id: 'parent' });
  show();
  password('New password');
  fireEvent.click(screen.getByRole('button', { name: 'Save password' }));
  await waitFor(() => expect(mocks.finish).toHaveBeenCalledOnce());
  expect(mocks.invite).toHaveBeenCalledWith('sample-invite', 'a-long-sample-password');
});
