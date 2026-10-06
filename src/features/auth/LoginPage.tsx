import { useEffect, useState } from 'react';
import { Alert, Box, Button, Divider, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  acceptInvite,
  getSettings,
  login,
  requestPasswordRecovery,
  signup,
  updateUser,
  type Settings,
} from '@netlify/identity';
import { demoEnabled } from '../../lib/api';
import { useAuth } from './AuthProvider';
export function LoginPage() {
  const {
    user,
    loading,
    enterDemo,
    error: authError,
    passwordAction,
    inviteToken,
    finishPasswordAction,
  } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>('login');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    let active = true;
    void getSettings()
      .then((value) => {
        if (active) setSettings(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const location = useLocation();
  const callbackError = new URLSearchParams(location.hash.replace(/^#/, '')).get(
    'error_description',
  );
  const settingPassword = !!passwordAction;
  const schema = z.object({
    email: settingPassword ? z.string() : z.string().trim().email('Enter a valid email address.'),
    password:
      mode === 'recover' && !settingPassword
        ? z.string()
        : z
            .string()
            .min(
              settingPassword || mode === 'signup' ? 10 : 1,
              settingPassword || mode === 'signup'
                ? 'Use at least 10 characters.'
                : 'Enter your password.',
            ),
    name:
      mode === 'signup' && !settingPassword
        ? z.string().trim().min(1, 'Enter your name.').max(100)
        : z.string(),
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string; password: string; name: string }>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', name: '' },
  });
  const switchMode = (next: typeof mode) => {
    setMode(next);
    setError('');
    setFeedback('');
    reset();
  };
  if (user && !loading && !settingPassword) return <Navigate to="/menu" replace />;
  const submit = handleSubmit(async ({ email, password, name }) => {
    setError('');
    setFeedback('');
    try {
      if (passwordAction === 'invite' && inviteToken) await acceptInvite(inviteToken, password);
      else if (passwordAction === 'recovery') await updateUser({ password });
      else if (mode === 'recover') {
        await requestPasswordRecovery(email);
        setFeedback('If that email has an account, a password reset link is on its way.');
        return;
      } else if (mode === 'signup') {
        const created = await signup(email, password, { full_name: name });
        if (!created.confirmedAt)
          setFeedback('Check your inbox to confirm your account, then return to sign in.');
        return;
      } else await login(email, password);
      if (settingPassword) finishPasswordAction();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not complete sign-in. Please try again.',
      );
    }
  });
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
      }}
    >
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          px: { xs: 4, md: 8 },
          py: { xs: 5, md: 8 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={`${import.meta.env.BASE_URL}school-logo.png`}
          alt="Cheverus School"
          sx={{ width: 70, height: 70, mb: 5 }}
        />
        <Typography sx={{ letterSpacing: 2, fontSize: 11, color: '#dbddb8', mb: 3 }}>
          CHEVERUS · SCHOOL DAY PLANS
        </Typography>
        <Typography variant="h1" sx={{ fontSize: { xs: 44, md: 64 }, mb: 3 }}>
          A little planning.
          <br />A smoother
          <br />
          school day.
        </Typography>
        <Typography sx={{ maxWidth: 390, color: '#d8e2d4', fontSize: 15 }}>
          Lunch, breakfast, and Extended Day — together in one simple plan. More time for the
          moments that matter.
        </Typography>
        <Box sx={{ mt: 5, display: 'flex', gap: 1.5 }}>
          {['Choose', 'Review', 'Share'].map((s, i) => (
            <Box
              key={s}
              sx={{ fontSize: 12, color: '#e2e8d9', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  border: '1px solid #7c9479',
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 10,
                }}
              >
                {i + 1}
              </Box>
              {s}
            </Box>
          ))}
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 4, md: 8 },
        }}
      >
        <Box sx={{ maxWidth: 380, width: '100%' }}>
          <Typography variant="h2" sx={{ mb: 1 }}>
            {settingPassword
              ? 'Set your password.'
              : mode === 'signup'
                ? 'Join your school plans.'
                : mode === 'recover'
                  ? 'Reset your password.'
                  : 'Welcome, parents.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {settingPassword
              ? 'Choose a password with at least 10 characters.'
              : mode === 'signup'
                ? 'Create your account with an email and password. Your family plans stay private.'
                : mode === 'recover'
                  ? 'We’ll email you a link to choose a new password.'
                  : 'Sign in to save your plans and return to them on any device.'}
          </Typography>
          {(error || authError || callbackError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || authError || callbackError}
            </Alert>
          )}
          {feedback && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {feedback}
            </Alert>
          )}
          <Box component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2 }}>
            {mode === 'signup' && !settingPassword && (
              <TextField
                label="Parent name"
                autoComplete="name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
            {!settingPassword && (
              <TextField
                label="Parent email"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            )}
            {(mode !== 'recover' || settingPassword) && (
              <TextField
                label={settingPassword ? 'New password' : 'Password'}
                type="password"
                autoComplete={
                  settingPassword || mode === 'signup' ? 'new-password' : 'current-password'
                }
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
              />
            )}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              endIcon={mode === 'recover' ? <MailOutlineIcon /> : <ArrowForwardIcon />}
              disabled={isSubmitting || loading}
            >
              {isSubmitting
                ? 'Please wait…'
                : settingPassword
                  ? 'Save password'
                  : mode === 'signup'
                    ? 'Create account'
                    : mode === 'recover'
                      ? 'Email me a reset link'
                      : 'Sign in'}
            </Button>
          </Box>
          {!settingPassword && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              {mode === 'login' ? (
                <>
                  {settings && !settings.disableSignup && (
                    <Button onClick={() => switchMode('signup')}>Create an account</Button>
                  )}
                  <Button onClick={() => switchMode('recover')}>Forgot password?</Button>
                </>
              ) : (
                <Button onClick={() => switchMode('login')}>Back to sign in</Button>
              )}
            </Box>
          )}
          {demoEnabled && (
            <>
              <Divider sx={{ my: 4 }} />
              <Button variant="outlined" fullWidth onClick={enterDemo}>
                Try the October demo
              </Button>
              <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1.5 }}>
                Explore using sample family data. Demo plans stay on this device and are not
                submitted to school.
              </Typography>
            </>
          )}
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 4 }}>
            Only your family can see your plans. You review every email before sending it.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
