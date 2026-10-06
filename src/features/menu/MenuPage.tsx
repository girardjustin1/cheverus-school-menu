import { Box, Button, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useSearchParams } from 'react-router-dom';
import { useSchool } from '../../app/WorkspaceContext';
import { useAutosave } from '../../hooks/useWorkspace';
import { DateRail } from '../../components/DateRail';
import { DailyPlan } from '../../components/DailyPlan';
import { dateLabel, emptyRequest, todayInSchool } from '../../utils/plans';
export function MenuPage() {
  const { child, month, requests } = useSchool();
  const [params, setParams] = useSearchParams();
  const autosave = useAutosave();
  if (!child)
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h2">Let’s add your child.</Typography>
        <Typography sx={{ my: 2 }}>Just a name and teacher details to get started.</Typography>
        <Button component={Link} to="/profile" variant="contained">
          Set up my family
        </Button>
      </Box>
    );
  if (!month)
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h2">The next menu is on its way.</Typography>
        <Typography sx={{ mt: 2 }}>Published school menus will appear here.</Typography>
      </Box>
    );
  if (month.status !== 'published')
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h2">
          {month.title} is {month.status}.
        </Typography>
        <Typography sx={{ my: 2 }}>
          You can review existing plans in My selections. New choices open when the menu is
          published.
        </Typography>
        <Button component={Link} to="/selections" variant="contained">
          Review selections
        </Button>
      </Box>
    );
  const day =
    month.days.find((d) => d.service_date === params.get('date')) ||
    month.days.find((d) => d.service_date === todayInSchool()) ||
    month.days[0];
  if (!day) return <Typography>No school dates are configured for this month.</Typography>;
  const index = month.days.findIndex((d) => d.id === day.id);
  const select = (id: string) =>
    setParams({ date: month.days.find((d) => d.id === id)!.service_date }, { replace: true });
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h2" sx={{ fontSize: 25 }}>
          {month.title}
        </Typography>
        <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
          Swipe to choose a date
        </Typography>
      </Box>
      <DateRail month={month} selectedId={day.id} requests={requests} onSelect={select} />
      <Box
        sx={{
          mt: 3,
          mb: 3,
          pb: 2,
          borderBottom: '1px solid #e4e6dd',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h2" sx={{ fontSize: { xs: 23, md: 27 } }}>
            {dateLabel(day.service_date)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12, mt: 0.5 }}>
            A plan for {child.first_name}’s school day.
          </Typography>
        </Box>
        {day.service_date === todayInSchool() && (
          <Box
            sx={{
              bgcolor: '#ede6c7',
              color: '#6b5a26',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            TODAY
          </Box>
        )}
      </Box>
      <DailyPlan
        day={day}
        categories={month.categories}
        childName={child.first_name}
        request={requests.find((r) => r.menu_day_id === day.id) || emptyRequest(child.id, day.id)}
        onChange={(request) => autosave.save(request, day)}
      />
      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', mt: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          disabled={index === 0}
          onClick={() => select(month.days[index - 1].id)}
          sx={{ fontSize: 12 }}
        >
          Previous
        </Button>
        {index < month.days.length - 1 ? (
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => select(month.days[index + 1].id)}
          >
            Next school day
          </Button>
        ) : (
          <Button component={Link} to="/selections" variant="contained">
            Review month
          </Button>
        )}
      </Box>
    </>
  );
}
