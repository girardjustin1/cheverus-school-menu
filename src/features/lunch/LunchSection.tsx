import { Alert, Box, Typography } from '@mui/material';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import { MealOptionCard } from '../../components/MealOptionCard';
import type { DailyRequest, MenuCategory, MenuDay, MenuOption } from '../../types/domain';
export function LunchSection({
  day,
  request,
  categories,
  disabled = false,
  onSelect,
}: {
  day: MenuDay;
  request: DailyRequest;
  categories: MenuCategory[];
  disabled?: boolean;
  onSelect: (option: MenuOption, category: MenuCategory) => void;
}) {
  return (
    <Box component="section" aria-labelledby="lunch-heading">
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.75 }}>
        <RestaurantOutlinedIcon sx={{ fontSize: 21 }} />
        <Typography id="lunch-heading" variant="h3">
          Lunch
        </Typography>
        <Typography sx={{ ml: 'auto', fontSize: 11, fontWeight: 600, color: 'text.secondary' }}>
          {categories.filter((c) => c.meal_type === 'lunch').length === 1 &&
          categories.find((c) => c.meal_type === 'lunch')?.selection_mode === 'single'
            ? 'ONE COMPLETE MEAL'
            : 'YOUR LUNCH PLAN'}
        </Typography>
      </Box>
      {!day.lunch_available ? (
        <Typography color="text.secondary">Lunch is not available on this date.</Typography>
      ) : (
        categories
          .filter((c) => c.meal_type === 'lunch')
          .map((category) => (
            <Box key={category.id} sx={{ mb: 2 }}>
              {category.name !== 'Lunch' && <Typography variant="h4">{category.name}</Typography>}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {category.description}{' '}
                {category.selection_mode === 'multiple' ? 'You may choose more than one.' : ''}
              </Typography>
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
              {!day.options.some((o) => o.menu_category_id === category.id) && (
                <Alert severity="info">Lunch options haven’t been added yet.</Alert>
              )}
            </Box>
          ))
      )}
      {day.note && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {day.note}
        </Alert>
      )}
    </Box>
  );
}
