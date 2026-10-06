import { Box, Button, Chip, Typography } from '@mui/material';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { MealOptionCard } from '../../components/MealOptionCard';
import type { DailyRequest, MenuCategory, MenuDay, MenuOption } from '../../types/domain';

export function BreakfastSection({
  day,
  request,
  categories,
  disabled = false,
  onDecline,
  onOptIn,
  onSelect,
}: {
  day: MenuDay;
  request: DailyRequest;
  categories: MenuCategory[];
  disabled?: boolean;
  onDecline: () => void;
  onOptIn: () => void;
  onSelect: (option: MenuOption, category: MenuCategory) => void;
}) {
  const breakfastCategories = categories.filter((c) => c.meal_type === 'breakfast');
  return (
    <Box
      component="section"
      aria-labelledby="breakfast-heading"
      sx={{
        border: '1px solid #e6e6da',
        bgcolor: '#fffdf5',
        borderRadius: 3,
        p: { xs: 2.5, md: 3 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <WbSunnyOutlinedIcon sx={{ fontSize: 21, color: '#91733b' }} />
        <Typography id="breakfast-heading" variant="h3">
          Breakfast
        </Typography>
        <Chip
          size="small"
          label="Optional"
          sx={{ ml: 'auto', bgcolor: '#f4eddb', color: '#6c562d' }}
        />
      </Box>
      {!day.breakfast_available ? (
        <Typography variant="body2" color="text.secondary">
          School breakfast is not available on this date.
        </Typography>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {day.breakfast_mode === 'opt_in'
              ? breakfastCategories[0]?.description ||
                'Request school breakfast. Items are selected by the school.'
              : 'Choose school breakfast, or skip it for the day.'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: day.breakfast_mode === 'choices' ? 2 : 0 }}>
            <Button
              fullWidth
              variant={request.breakfast_status === 'declined' ? 'contained' : 'outlined'}
              disabled={disabled}
              aria-pressed={request.breakfast_status === 'declined'}
              onClick={onDecline}
              startIcon={request.breakfast_status === 'declined' ? <CheckIcon /> : undefined}
            >
              No school breakfast
            </Button>
            {day.breakfast_mode === 'opt_in' && (
              <Button
                fullWidth
                variant={request.breakfast_status === 'selected' ? 'contained' : 'outlined'}
                disabled={disabled}
                aria-pressed={request.breakfast_status === 'selected'}
                onClick={onOptIn}
              >
                Yes, breakfast
              </Button>
            )}
          </Box>
          {day.breakfast_mode === 'choices' &&
            breakfastCategories.map((category) => (
              <Box key={category.id} sx={{ mt: 2 }}>
                {breakfastCategories.length > 1 && (
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {category.name}
                  </Typography>
                )}
                <Box className="meal-grid">
                  {day.options
                    .filter((o) => o.menu_category_id === category.id)
                    .map((option) => (
                      <MealOptionCard
                        key={option.id}
                        option={option}
                        selected={request.option_ids.includes(option.id)}
                        disabled={disabled || category.selection_mode === 'informational'}
                        onSelect={() => onSelect(option, category)}
                      />
                    ))}
                </Box>
              </Box>
            ))}
          {day.breakfast_mode === 'choices' &&
            !day.options.some((o) => o.meal_type === 'breakfast') && (
              <Typography variant="body2" color="text.secondary">
                Breakfast choices haven’t been configured. You can leave breakfast unrequested.
              </Typography>
            )}
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1.5 }}>
            Breakfast is always optional. Leaving it blank won’t hold up your day.
          </Typography>
        </>
      )}
    </Box>
  );
}
