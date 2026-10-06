import { Box, ButtonBase, Chip, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { breakfastLabel, completion, dateLabel, edpLabel, mealNames } from '../../utils/plans';
import type { DailyRequest, MenuMonth } from '../../types/domain';
export function MonthSelectionSummary({
  month,
  requests,
  onEdit,
}: {
  month: MenuMonth;
  requests: DailyRequest[];
  onEdit: (id: string) => void;
}) {
  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      {month.days.map((day) => {
        const request = requests.find((r) => r.menu_day_id === day.id);
        const status = completion(day, request, month.categories);
        return (
          <ButtonBase
            key={day.id}
            onClick={() => onEdit(day.id)}
            aria-label={`Edit ${dateLabel(day.service_date)}`}
            sx={{
              p: { xs: 2, md: 2.5 },
              bgcolor: 'white',
              border: '1px solid #e3e6dd',
              borderRadius: 3,
              display: 'block',
              textAlign: 'left',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 1,
                alignItems: 'center',
                mb: day.no_school ? 0 : 1.5,
              }}
            >
              <Typography variant="h4">{dateLabel(day.service_date)}</Typography>
              <Chip
                size="small"
                color={status.state === 'complete' ? 'success' : 'default'}
                label={status.state === 'complete' ? 'Complete ✓' : status.label}
              />
            </Box>
            {!day.no_school && (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '2fr 1.5fr 1.5fr' },
                  gap: 1,
                }}
              >
                {[
                  [
                    'Lunch',
                    day.lunch_available
                      ? mealNames(day, request, 'lunch').join(', ') || 'Not selected'
                      : 'Not available',
                  ],
                  ['Breakfast', breakfastLabel(day, request)],
                  ['EDP', edpLabel(day, request)],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography
                      sx={{
                        fontSize: 10,
                        letterSpacing: 1,
                        fontWeight: 700,
                        color: 'text.secondary',
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </Typography>
                    <Typography variant="body2">{value}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            {request?.updated_at && (
              <Typography sx={{ fontSize: 10, mt: 1.5, color: 'text.secondary' }}>
                Last saved {new Date(request.updated_at).toLocaleString()}
              </Typography>
            )}
            <ArrowForwardIcon
              aria-hidden="true"
              sx={{ position: 'absolute', bottom: 16, right: 16, fontSize: 16, opacity: 0.5 }}
            />
          </ButtonBase>
        );
      })}
    </Box>
  );
}
