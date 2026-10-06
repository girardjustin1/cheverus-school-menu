import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckIcon from '@mui/icons-material/Check';
import type { EdpStatus } from '../../types/domain';

export function EdpAttendanceSelector({ childName, available, value, note = '', disabled = false, loading = false, onChange }: { childName: string; available: boolean | null; value: EdpStatus; note?: string; disabled?: boolean; loading?: boolean; onChange: (value: EdpStatus) => void }) {
  return <Box component="section" aria-labelledby="edp-heading" sx={{ bgcolor: '#f0f3ed', border: '1px solid #e0e5da', borderRadius: 3, p: { xs: 2.5, md: 3 } }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}><AccessTimeIcon sx={{ fontSize: 21 }} /><Typography id="edp-heading" variant="h3">Extended Day Program</Typography>{loading && <CircularProgress size={16} aria-label="Saving EDP" />}</Box>
    {available === null ? <Alert severity="info" sx={{ mt: 2 }}>EDP schedule awaiting confirmation. Attendance selection will open once the school confirms availability.</Alert> : !available ? <Typography variant="body2" color="text.secondary">EDP is not available on this date.</Typography> : <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: .5 }}>Will {childName} attend EDP?</Typography>
      {note && <Typography variant="body2" sx={{ mb: 2, fontSize: 12 }}>{note}</Typography>}
      <Box role="group" aria-label="EDP attendance" sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button fullWidth variant={value === 'not_attending' ? 'contained' : 'outlined'} aria-pressed={value === 'not_attending'} disabled={disabled || loading} onClick={() => onChange('not_attending')} startIcon={value === 'not_attending' ? <CheckIcon /> : undefined}>No EDP</Button>
        <Button fullWidth variant={value === 'attending' ? 'contained' : 'outlined'} aria-pressed={value === 'attending'} disabled={disabled || loading} onClick={() => onChange('attending')} startIcon={value === 'attending' ? <CheckIcon /> : undefined}>Yes, attending</Button>
      </Box>
      <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 1.5 }} role="status">{value === 'not_answered' ? 'Please choose yes or no.' : value === 'attending' ? `${childName} is attending EDP.` : `${childName} is not attending EDP.`}</Typography>
    </>}
  </Box>;
}
