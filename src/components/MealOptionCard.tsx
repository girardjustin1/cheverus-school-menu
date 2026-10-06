import { Box, Card, CardActionArea, Chip, Typography } from '@mui/material';
import LunchDiningOutlinedIcon from '@mui/icons-material/LunchDiningOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { MenuOption } from '../types/domain';

export function MealOptionCard({
  option,
  selected = false,
  disabled = false,
  onSelect,
}: {
  option: MenuOption;
  selected?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  const colors =
    option.illustration === 'sunbutter'
      ? ['#f0ddc1', '#a47e43']
      : option.illustration === 'cheese'
        ? ['#f4eccd', '#aa9037']
        : ['#e2eadc', '#728b57'];
  return (
    <Card
      sx={{
        border: selected ? '2px solid #244b3e' : '2px solid #e7e8e1',
        height: '100%',
        bgcolor: selected ? '#f5f8f2' : 'white',
        transition: 'border-color .15s',
      }}
    >
      <CardActionArea
        aria-pressed={selected}
        disabled={disabled || option.unavailable}
        onClick={onSelect}
        sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <Box
          aria-hidden="true"
          sx={{
            height: 122,
            bgcolor: colors[0],
            position: 'relative',
            overflow: 'hidden',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Box
            sx={{
              width: 86,
              height: 86,
              borderRadius: '50%',
              bgcolor: '#ffffff8c',
              display: 'grid',
              placeItems: 'center',
              transform: 'rotate(-8deg)',
            }}
          >
            <LunchDiningOutlinedIcon sx={{ fontSize: 58, color: colors[1] }} />
          </Box>
          <Box
            sx={{
              position: 'absolute',
              left: 18,
              bottom: 17,
              width: 8,
              height: 8,
              bgcolor: colors[1],
              borderRadius: '50%',
              opacity: 0.35,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 28,
              top: 22,
              width: 22,
              height: 22,
              border: `2px solid ${colors[1]}`,
              borderRadius: '50%',
              opacity: 0.25,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 12,
              bottom: 10,
              bgcolor: 'white',
              borderRadius: 6,
              p: 0.4,
              display: 'flex',
              color: selected ? 'primary.main' : '#829083',
            }}
          >
            {selected ? <CheckCircleIcon /> : <RadioButtonUncheckedIcon />}
          </Box>
        </Box>
        <Box sx={{ p: 2, flex: 1 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}
          >
            <Typography
              variant="overline"
              sx={{ fontSize: 10, color: 'text.secondary', letterSpacing: 1.2 }}
            >
              {option.illustration === 'hot' ? 'ON THE MENU' : 'DAILY OPTION'}
            </Typography>
            {option.dietary_label && (
              <Chip
                size="small"
                label={
                  option.dietary_label === 'V'
                    ? 'Vegetarian'
                    : option.dietary_label === 'H'
                      ? 'Halal'
                      : option.dietary_label
                }
                sx={{ height: 22, bgcolor: '#eef1e8', fontSize: 10 }}
              />
            )}
          </Box>
          <Typography variant="h4" sx={{ fontSize: 16, lineHeight: 1.4, mb: 1 }}>
            {option.name}
          </Typography>
          <Typography variant="body2" sx={{ fontSize: 12, color: 'text.secondary' }}>
            {option.description}
          </Typography>
          {(selected || option.unavailable) && (
            <Typography sx={{ mt: 1, fontSize: 12, fontWeight: 700 }}>
              {option.unavailable ? 'Unavailable' : 'Selected'}
            </Typography>
          )}
        </Box>
      </CardActionArea>
    </Card>
  );
}
