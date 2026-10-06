import { useState } from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useSchool } from '../../app/WorkspaceContext';
import { useAutosave } from '../../hooks/useWorkspace';
import { completion } from '../../utils/plans';
import { generateEmail } from '../email/generateEmail';
import { MonthSelectionSummary } from './MonthSelectionSummary';
export function SelectionsPage() {
  const { child, month, requests, family } = useSchool();
  const autosave = useAutosave();
  const navigate = useNavigate();
  const [copied, setCopied] = useState('');
  if (!child || !month)
    return (
      <Typography>Add a child and choose a published month to see your selections.</Typography>
    );
  const missing = month.days.filter(
    (d) =>
      completion(
        d,
        requests.find((r) => r.menu_day_id === d.id),
        month.categories,
      ).state === 'incomplete',
  );
  const copy = async () => {
    try {
      await autosave.flush();
      await navigator.clipboard.writeText(
        generateEmail({
          child,
          profile: family.profile,
          month,
          requests,
          dayIds: month.days
            .filter((d) => requests.some((r) => r.menu_day_id === d.id))
            .map((d) => d.id),
        }).body,
      );
      setCopied('Daily selections copied.');
    } catch (err) {
      setCopied(err instanceof Error ? err.message : 'Copy failed.');
    }
  };
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Everything requested for {child.first_name}, including days still to plan. Saving a plan
        doesn’t send it to school.
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <Button component={Link} to="/email" variant="contained">
          Generate email
        </Button>
        {missing.length > 0 && (
          <Button
            variant="outlined"
            onClick={() => navigate(`/menu?date=${missing[0].service_date}`)}
          >
            Complete missing days ({missing.length})
          </Button>
        )}
        <Button startIcon={<ContentCopyIcon />} onClick={() => void copy()}>
          Copy daily selections
        </Button>
      </Box>
      {copied && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setCopied('')}>
          {copied}
        </Alert>
      )}
      <MonthSelectionSummary
        month={month}
        requests={requests}
        onEdit={(id) => navigate(`/menu?date=${month.days.find((d) => d.id === id)!.service_date}`)}
      />
    </>
  );
}
