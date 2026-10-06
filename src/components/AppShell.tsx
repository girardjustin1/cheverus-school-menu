import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Container,
  IconButton,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useSchool } from '../app/WorkspaceContext';
import { useAutosave } from '../hooks/useWorkspace';
import { completion } from '../utils/plans';
const navigation = [
  { to: '/menu', label: 'Daily menu', icon: RestaurantOutlinedIcon },
  { to: '/selections', label: 'My selections', icon: ChecklistOutlinedIcon },
  { to: '/email', label: 'Email plans', icon: MailOutlineIcon },
  { to: '/profile', label: 'Family', icon: PersonOutlineIcon },
];
export function AppShell() {
  const { family, child, month, months, requests, setChildId, setMonthId, demo } = useSchool();
  const autosave = useAutosave();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const schoolDays = month?.days.filter((d) => !d.no_school) || [];
  const complete = schoolDays.filter(
    (d) =>
      completion(
        d,
        requests.find((r) => r.menu_day_id === d.id),
        month!.categories,
      ).state === 'complete',
  ).length;
  return (
    <>
      <Box
        component="a"
        href="#main"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById('main');
          main?.focus();
          main?.scrollIntoView();
        }}
        sx={{
          position: 'fixed',
          left: 16,
          top: -100,
          zIndex: 1500,
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          '&:focus': { top: 8 },
        }}
      >
        Skip to content
      </Box>
      <Box component="header" sx={{ bgcolor: '#fffefa', borderBottom: '1px solid #e5e7de' }}>
        <Container
          maxWidth="lg"
          sx={{
            height: { xs: 76, md: 90 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <ButtonBase
            component={Link}
            to="/menu"
            sx={{ gap: 1.5, textAlign: 'left', borderRadius: 1 }}
          >
            <Box
              component="img"
              src={`${import.meta.env.BASE_URL}school-logo.png`}
              alt="Cheverus School"
              sx={{ width: 45, height: 45 }}
            />
            <Box>
              <Typography
                sx={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 23, lineHeight: 1.1 }}
              >
                Cheverus
              </Typography>
              <Typography sx={{ fontSize: 9, letterSpacing: 2, color: 'text.secondary', mt: 0.5 }}>
                SCHOOL DAY PLANS
              </Typography>
            </Box>
          </ButtonBase>
          <Box
            component="nav"
            aria-label="Main navigation"
            sx={{ display: { xs: 'none', md: 'flex' }, gap: 3 }}
          >
            {navigation.slice(0, 3).map(({ to, label }) => (
              <ButtonBase
                component={NavLink}
                key={to}
                to={to}
                sx={{
                  px: 1,
                  minHeight: 44,
                  fontSize: 13,
                  color: 'text.secondary',
                  borderBottom: '2px solid transparent',
                  '&.active': {
                    color: 'primary.main',
                    borderBottomColor: 'primary.main',
                    fontWeight: 700,
                  },
                }}
              >
                {label}
              </ButtonBase>
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 12, display: { xs: 'none', sm: 'block' } }}>
              Hi, {family.profile.display_name || 'there'}
            </Typography>
            <IconButton component={Link} to="/profile" aria-label="Family profile">
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: '#e7eadc',
                  color: 'primary.main',
                  fontSize: 13,
                }}
              >
                {(family.profile.display_name || 'P').slice(0, 1)}
              </Avatar>
            </IconButton>
          </Box>
        </Container>
      </Box>
      {demo && (
        <Box sx={{ bgcolor: '#f1ead6', textAlign: 'center', py: 0.65, px: 2 }}>
          <Typography sx={{ fontSize: 11, color: '#645324' }}>
            Demo workspace · Sample data saves on this device · No school submission
          </Typography>
        </Box>
      )}
      {autosave.status === 'error' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={autosave.retry}>
              Retry save
            </Button>
          }
          sx={{ borderRadius: 0 }}
        >
          Your latest changes haven’t saved. {autosave.error} They remain visible; retry before
          leaving.
        </Alert>
      )}
      <Container
        maxWidth="lg"
        component="main"
        id="main"
        tabIndex={-1}
        sx={{ pt: { xs: 3, md: 5 }, pb: { xs: 12, md: 5 } }}
      >
        {!isAdmin && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 2,
              mb: { xs: 3, md: 4 },
              flexWrap: 'wrap',
            }}
          >
            <Box>
              <Typography
                sx={{
                  display: { xs: 'none', md: 'block' },
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: '#75816e',
                  mb: 1,
                }}
              >
                A LITTLE PLANNING. A SMOOTHER DAY.
              </Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: 31, md: 52 } }}>
                {location.pathname === '/menu'
                  ? 'School days, sorted.'
                  : location.pathname === '/selections'
                    ? 'All your plans, together.'
                    : location.pathname === '/email'
                      ? 'Ready to share.'
                      : 'Your school family.'}
              </Typography>
            </Box>
            {family.profile.role === 'admin' && (
              <Button
                component={Link}
                to="/admin/menus"
                size="small"
                variant="text"
                sx={{ fontSize: 12, display: { xs: 'none', md: 'flex' } }}
              >
                Manage menus <ArrowForwardIcon sx={{ ml: 1, fontSize: 16 }} />
              </Button>
            )}
          </Box>
        )}
        {!isAdmin && child && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              select
              size="small"
              label="Ordering for"
              value={child.id}
              onChange={(e) => setChildId(e.target.value)}
              sx={{ width: { xs: 'calc(50% - 8px)', sm: 210 } }}
            >
              {family.children.map((c) => (
                <MenuItem value={c.id} key={c.id}>
                  {c.first_name}
                  {c.homeroom ? ` · ${c.homeroom}` : ''}
                </MenuItem>
              ))}
            </TextField>
            {month && (
              <TextField
                select
                size="small"
                label="Month"
                value={month.id}
                onChange={(e) => setMonthId(e.target.value)}
                sx={{ width: { xs: 'calc(50% - 8px)', sm: 210 } }}
              >
                {months.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.title}
                    {m.status !== 'published' ? ` · ${m.status}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {autosave.status !== 'idle' && (
              <Typography
                role="status"
                sx={{
                  fontSize: 11,
                  color: 'text.secondary',
                  ml: 'auto',
                  display: 'flex',
                  gap: 0.5,
                  alignItems: 'center',
                }}
              >
                {autosave.status === 'saving' ? (
                  'Saving…'
                ) : autosave.status === 'error' ? (
                  'Not saved'
                ) : (
                  <>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 14 }} />
                    {demo ? 'Saved on device' : 'Saved'}
                  </>
                )}
              </Typography>
            )}
          </Box>
        )}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns:
              location.pathname === '/menu'
                ? { xs: '1fr', md: 'minmax(0,1fr) 265px' }
                : 'minmax(0,1fr)',
            gap: 4,
            alignItems: 'start',
          }}
        >
          <Box sx={{ minWidth: 0 }} className="page-enter">
            <Outlet />
          </Box>
          {location.pathname === '/menu' && month && child && (
            <Box
              component="aside"
              aria-label="Month progress"
              sx={{ display: { xs: 'none', md: 'block' }, position: 'sticky', top: 24 }}
            >
              <Box sx={{ bgcolor: '#eef1e7', p: 3, borderRadius: 3, border: '1px solid #e1e6d8' }}>
                <Typography sx={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, mb: 2 }}>
                  A LOOK AT YOUR MONTH
                </Typography>
                <Typography variant="h2" sx={{ fontSize: 27, mb: 1 }}>
                  {month.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  A little less to think about tomorrow.
                </Typography>
                <Typography sx={{ mt: 3, mb: 1, fontWeight: 700, fontSize: 13 }}>
                  {complete} of {schoolDays.length} days planned
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={schoolDays.length ? (complete / schoolDays.length) * 100 : 0}
                  sx={{ height: 5, borderRadius: 5, bgcolor: '#d8dfcc' }}
                />
                <Box
                  sx={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 0.8, mt: 2.5 }}
                >
                  {schoolDays.map((d) => (
                    <Box
                      key={d.id}
                      sx={{
                        height: 29,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 1,
                        bgcolor:
                          completion(
                            d,
                            requests.find((r) => r.menu_day_id === d.id),
                            month.categories,
                          ).state === 'complete'
                            ? 'primary.main'
                            : '#ffffffa0',
                        color:
                          completion(
                            d,
                            requests.find((r) => r.menu_day_id === d.id),
                            month.categories,
                          ).state === 'complete'
                            ? 'white'
                            : 'text.secondary',
                        fontSize: 11,
                      }}
                      aria-label={`${d.service_date}: ${
                        completion(
                          d,
                          requests.find((r) => r.menu_day_id === d.id),
                          month.categories,
                        ).label
                      }`}
                    >
                      {Number(d.service_date.slice(-2))}
                    </Box>
                  ))}
                </Box>
                <Button
                  component={Link}
                  to="/selections"
                  fullWidth
                  variant="outlined"
                  sx={{ mt: 3, fontSize: 12 }}
                >
                  Review my selections
                </Button>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="h4" sx={{ mb: 1, fontSize: 14 }}>
                  Plan. Review. Send.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                  Your choices save as you go. When you’re ready, share them with your child’s
                  teacher from your usual email app.
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 2 }}>
                  Menus are subject to change.
                </Typography>
              </Box>
            </Box>
          )}
        </Box>
        <Box
          component="footer"
          sx={{
            borderTop: '1px solid #e4e6dd',
            mt: 5,
            pt: 2,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
            Cheverus School · Made for simpler school mornings
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
            Healthy bodies. Happy minds.
          </Typography>
        </Box>
      </Container>
      <Box
        component="nav"
        aria-label="Mobile navigation"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#fffefa',
          borderTop: '1px solid #e3e6dc',
          pt: 0.5,
          pb: 'max(8px, env(safe-area-inset-bottom))',
          zIndex: 1000,
        }}
      >
        {navigation.map(({ to, label, icon: Icon }) => (
          <ButtonBase
            key={to}
            component={NavLink}
            to={to}
            sx={{
              flex: 1,
              flexDirection: 'column',
              gap: 0.4,
              minHeight: 56,
              color: 'text.secondary',
              '&.active': { color: 'primary.main', bgcolor: '#f0f3ea' },
            }}
          >
            <Icon sx={{ fontSize: 21 }} />
            <Typography sx={{ fontSize: 9, fontWeight: 600 }}>{label}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </>
  );
}
