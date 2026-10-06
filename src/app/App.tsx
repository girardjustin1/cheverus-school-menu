import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { AuthProvider, useAuth } from '../features/auth/AuthProvider';
import { WorkspaceProvider } from './WorkspaceContext';
import { SaveProvider } from '../hooks/useWorkspace';
import { AppShell } from '../components/AppShell';
import { LoginPage } from '../features/auth/LoginPage';
import { MenuPage } from '../features/menu/MenuPage';
const SelectionsPage = lazy(() =>
  import('../features/selections/SelectionsPage').then((m) => ({ default: m.SelectionsPage })),
);
const EmailPage = lazy(() =>
  import('../features/email/EmailPage').then((m) => ({ default: m.EmailPage })),
);
const ProfilePage = lazy(() =>
  import('../features/children/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const AdminPage = lazy(() =>
  import('../features/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);
function Protected() {
  const { user, loading, demo } = useAuth();
  if (loading)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress aria-label="Loading session" />
      </Box>
    );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <WorkspaceProvider key={`${user.id}:${demo}`}>
      <SaveProvider>
        <AppShell />
      </SaveProvider>
    </WorkspaceProvider>
  );
}
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense
          fallback={
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress aria-label="Loading page" />
            </Box>
          }
        >
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth/callback" element={<LoginPage />} />
            <Route element={<Protected />}>
              <Route index element={<Navigate to="/menu" replace />} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/selections" element={<SelectionsPage />} />
              <Route path="/email" element={<EmailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<Navigate to="/admin/menus" replace />} />
              <Route path="/admin/menus" element={<AdminPage />} />
              <Route
                path="*"
                element={
                  <Typography>
                    Page not found. Use the navigation to return to your plans.
                  </Typography>
                }
              />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
