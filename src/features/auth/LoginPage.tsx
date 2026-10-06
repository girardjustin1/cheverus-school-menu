import { useState } from 'react';
import { Alert, Box, Button, Divider, TextField, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { demoEnabled, supabase } from '../../lib/supabase/client';
import { useAuth } from './AuthProvider';
const schema = z.object({ email: z.string().trim().email('Enter a valid email address.') });
export function LoginPage() {
  const { user, loading, enterDemo, error: authError } = useAuth();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const callbackError = new URLSearchParams(location.hash.replace(/^#/, '')).get(
    'error_description',
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  if (user && !loading) return <Navigate to="/menu" replace />;
  const submit = handleSubmit(async ({ email }) => {
    setError('');
    if (!supabase) {
      setError(
        'Cloud sign-in isn’t connected yet. Add the Supabase settings in Netlify, or explore the demo below.',
      );
      return;
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
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
          src="/school-logo.png"
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
            {sent ? 'Check your inbox.' : 'Welcome, parents.'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {sent
              ? 'We sent you a sign-in link. Open it to return to your school plans. You can close this tab.'
              : 'Sign in with your email. No password to remember.'}
          </Typography>
          {(error || authError || callbackError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error || authError || callbackError}
            </Alert>
          )}
          {!sent && (
            <Box component="form" onSubmit={submit}>
              <TextField
                label="Parent email"
                type="email"
                autoComplete="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                endIcon={<ArrowForwardIcon />}
                disabled={isSubmitting || loading}
                sx={{ mt: 2 }}
              >
                {isSubmitting ? 'Sending link…' : 'Email me a sign-in link'}
              </Button>
            </Box>
          )}
          {sent && (
            <Button
              variant="outlined"
              startIcon={<MailOutlineIcon />}
              onClick={() => setSent(false)}
            >
              Use a different email
            </Button>
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
