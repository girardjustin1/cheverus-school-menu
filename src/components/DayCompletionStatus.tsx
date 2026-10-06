import { Box, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { completion } from '../utils/plans';
import type { DailyRequest, MenuCategory, MenuDay } from '../types/domain';
export function DayCompletionStatus({ day, request, categories }: { day: MenuDay; request?: DailyRequest; categories: MenuCategory[] }) {
  const result = completion(day, request, categories);
  return <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: result.state === 'complete' ? 'primary.main' : 'text.secondary', mt: 2 }}>
    {result.state === 'complete' ? <CheckCircleOutlineIcon fontSize="small" /> : <RadioButtonUncheckedIcon fontSize="small" />}
    <Box><Typography sx={{ fontSize: 13, fontWeight: 700 }}>{result.label}</Typography>{result.missing.length > 0 && <Typography sx={{ fontSize: 11 }}>Still needed: {result.missing.join(' · ')}</Typography>}</Box>
  </Box>;
}
