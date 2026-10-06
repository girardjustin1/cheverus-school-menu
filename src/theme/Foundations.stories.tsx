import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Typography } from '@mui/material';
const meta = { title: 'Foundations/Theme' } satisfies Meta;
export default meta;
export const ColorsAndTypography: StoryObj = {
  render: () => (
    <>
      <Typography variant="h1">School days, sorted.</Typography>
      <Typography variant="h2" sx={{ mt: 3 }}>
        October 2026
      </Typography>
      <Typography variant="h3" sx={{ mt: 3 }}>
        Lunch, breakfast, and Extended Day.
      </Typography>
      <Typography sx={{ mt: 2 }}>
        Clear choices, comfortable touch targets, and quiet save feedback.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        {[
          ['School green', '#244b3e'],
          ['Ivory', '#faf9f5'],
          ['Sage', '#eef1e7'],
          ['Sunshine', '#ead889'],
        ].map(([name, color]) => (
          <Box key={name}>
            <Box
              sx={{
                width: 80,
                height: 80,
                bgcolor: color,
                border: '1px solid #ddd',
                borderRadius: 2,
              }}
            />
            <Typography variant="body2">{name}</Typography>
          </Box>
        ))}
      </Box>
    </>
  ),
};
