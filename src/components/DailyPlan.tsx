import { Alert, Box, Typography } from '@mui/material';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { LunchSection } from '../features/lunch/LunchSection';
import { BreakfastSection } from '../features/breakfast/BreakfastSection';
import { EdpAttendanceSelector } from '../features/edp/EdpAttendanceSelector';
import { DayCompletionStatus } from './DayCompletionStatus';
import { declineBreakfast, normalizeRequestForDay, selectOption } from '../utils/plans';
import type { DailyRequest, MenuCategory, MenuDay } from '../types/domain';

export function DailyPlan({
  day,
  categories,
  childName,
  request,
  disabled = false,
  onChange,
}: {
  day: MenuDay;
  categories: MenuCategory[];
  childName: string;
  request: DailyRequest;
  disabled?: boolean;
  onChange: (request: DailyRequest) => void;
}) {
  const originalRequest = request;
  request = normalizeRequestForDay(request, day, categories);
  const menuChanged =
    originalRequest.edp_status !== request.edp_status ||
    originalRequest.breakfast_status !== request.breakfast_status ||
    JSON.stringify(originalRequest.option_ids) !== JSON.stringify(request.option_ids);
  if (day.no_school)
    return (
      <Box sx={{ textAlign: 'center', py: 6, px: 3, bgcolor: '#f0f3ed', borderRadius: 3 }}>
        <SchoolOutlinedIcon sx={{ fontSize: 54, mb: 2, color: '#789077' }} />
        <Typography variant="h2" sx={{ mb: 1 }}>
          A day off from school.
        </Typography>
        <Typography color="text.secondary">No lunch, breakfast, or EDP to plan today.</Typography>
        {day.note && <Typography sx={{ mt: 2 }}>{day.note}</Typography>}
      </Box>
    );
  const onSelect = (option: MenuDay['options'][number], category: MenuCategory) =>
    onChange(selectOption(request, option, category, day.options));
  return (
    <>
      {menuChanged && (
        <Alert severity="info" sx={{ mb: 2 }}>
          The school menu or service availability changed since this plan was saved. Review your
          choices; changes save when you make a selection.
        </Alert>
      )}
      <LunchSection
        day={day}
        categories={categories}
        request={request}
        onSelect={onSelect}
        disabled={disabled}
      />
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2, mt: 3 }}
      >
        <BreakfastSection
          day={day}
          request={request}
          categories={categories}
          disabled={disabled}
          onSelect={onSelect}
          onDecline={() => onChange(declineBreakfast(request, day.options))}
          onOptIn={() =>
            onChange({ ...declineBreakfast(request, day.options), breakfast_status: 'selected' })
          }
        />
        <EdpAttendanceSelector
          childName={childName}
          available={day.edp_available}
          value={request.edp_status}
          note={day.edp_note}
          disabled={disabled}
          onChange={(edp_status) => onChange({ ...request, edp_status })}
        />
      </Box>
      <DayCompletionStatus day={day} request={request} categories={categories} />
    </>
  );
}
