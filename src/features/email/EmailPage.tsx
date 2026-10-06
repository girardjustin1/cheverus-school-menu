import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { z } from 'zod';
import { useSchool } from '../../app/WorkspaceContext';
import { useAutosave, useWorkspace } from '../../hooks/useWorkspace';
import { saveDraft } from '../../lib/repository';
import { completion, dateLabel, todayInSchool } from '../../utils/plans';
import { generateEmail, buildMailto } from './generateEmail';
import { EmailPreview } from './EmailPreview';
import type { Child, DailyRequest, EmailDraft, MenuMonth, Profile } from '../../types/domain';
export function EmailPage() {
  const { child, month, requests, family, demo } = useSchool();
  if (!child || !month)
    return <Typography>Add a child and choose a month to prepare an email.</Typography>;
  return (
    <EmailBuilder
      key={`${child.id}:${month.id}`}
      child={child}
      month={month}
      requests={requests}
      profile={family.profile}
      drafts={family.drafts.filter((d) => d.child_id === child.id && d.menu_month_id === month.id)}
      demo={demo}
    />
  );
}
function EmailBuilder({
  child,
  month,
  requests,
  profile,
  drafts,
  demo,
}: {
  child: Child;
  month: MenuMonth;
  requests: DailyRequest[];
  profile: Profile;
  drafts: EmailDraft[];
  demo: boolean;
}) {
  const autosave = useAutosave();
  const { familyKey } = useWorkspace();
  const queryClient = useQueryClient();
  const [scope, setScope] = useState('month');
  const [single, setSingle] = useState(
    month.days.find((d) => d.service_date === todayInSchool())?.id || month.days[0]?.id || '',
  );
  const [selected, setSelected] = useState<string[]>(
    month.days.filter((d) => requests.some((r) => r.menu_day_id === d.id)).map((d) => d.id),
  );
  const [recipient, setRecipient] = useState(child.teacher_email);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState('');
  const dayIds =
    scope === 'month' ? month.days.map((d) => d.id) : scope === 'day' ? [single] : selected;
  const email = { ...generateEmail({ child, month, requests, profile, dayIds }), recipient };
  const missing = month.days.filter(
    (d) =>
      dayIds.includes(d.id) &&
      completion(
        d,
        requests.find((r) => r.menu_day_id === d.id),
        month.categories,
      ).state === 'incomplete',
  );
  const emailValid = z.string().email().safeParse(recipient.trim()).success;
  const prepare = async (open: boolean) => {
    setBusy(true);
    setFailure('');
    setMessage('');
    try {
      await autosave.flush();
      if (!dayIds.length) throw new Error('Choose at least one date.');
      if (open && !emailValid) throw new Error('Enter a valid recipient before opening email.');
      if (open && missing.length)
        throw new Error('Complete the required decisions for the dates in this email first.');
      if (!open)
        await navigator.clipboard.writeText(
          `To: ${recipient || '(recipient needed)'}\nSubject: ${email.subject}\n\n${email.body}`,
        );
      const draft: EmailDraft = {
        id: crypto.randomUUID(),
        child_id: child.id,
        menu_month_id: month.id,
        recipient,
        subject: email.subject,
        body: email.body,
        service_dates: month.days.filter((d) => dayIds.includes(d.id)).map((d) => d.service_date),
        created_at: new Date().toISOString(),
        opened_at: open ? new Date().toISOString() : null,
      };
      await saveDraft(draft, demo);
      await queryClient.invalidateQueries({ queryKey: familyKey });
      if (open) {
        window.location.href = buildMailto(recipient, email.subject, email.body);
        setMessage('Email draft prepared. Review and send it in your email app.');
      } else setMessage('Email copied. A snapshot is saved below for your records.');
    } catch (err) {
      setFailure(err instanceof Error ? err.message : 'Could not prepare email.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose the dates to share, review the message, then send it from your usual email app.
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '290px minmax(0,1fr)' },
          gap: 3,
          alignItems: 'start',
        }}
      >
        <Box sx={{ p: 2.5, bgcolor: '#f0f3ea', borderRadius: 3 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Prepare your email
          </Typography>
          <TextField
            select
            label="Include"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            size="small"
            sx={{ mb: 2 }}
          >
            <MenuItem value="month">Entire month</MenuItem>
            <MenuItem value="day">One day</MenuItem>
            <MenuItem value="several">Choose dates</MenuItem>
          </TextField>
          {scope === 'day' && (
            <TextField
              select
              size="small"
              label="School date"
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              sx={{ mb: 2 }}
            >
              {month.days.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {dateLabel(d.service_date)}
                </MenuItem>
              ))}
            </TextField>
          )}
          {scope === 'several' && (
            <Box sx={{ maxHeight: 270, overflowY: 'auto', mb: 2 }}>
              {month.days.map((d) => (
                <FormControlLabel
                  key={d.id}
                  sx={{ display: 'flex', '& .MuiFormControlLabel-label': { fontSize: 12 } }}
                  label={dateLabel(d.service_date)}
                  control={
                    <Checkbox
                      size="small"
                      checked={selected.includes(d.id)}
                      onChange={() =>
                        setSelected((ids) =>
                          ids.includes(d.id) ? ids.filter((id) => id !== d.id) : [...ids, d.id],
                        )
                      }
                    />
                  }
                />
              ))}
            </Box>
          )}
          <TextField
            label="Recipient email"
            type="email"
            size="small"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            error={!!recipient && !emailValid}
            helperText={
              recipient && !emailValid
                ? 'Enter a valid email address.'
                : 'Confirm your teacher or school contact.'
            }
          />
          <Typography sx={{ fontSize: 11, mt: 2, color: 'text.secondary' }}>
            {dayIds.length} dates included · {child.first_name}
          </Typography>
          <Button
            variant="contained"
            fullWidth
            startIcon={<OpenInNewIcon />}
            sx={{ mt: 3 }}
            disabled={
              busy ||
              !emailValid ||
              !dayIds.length ||
              !!missing.length ||
              autosave.status === 'error'
            }
            onClick={() => void prepare(true)}
          >
            Open Email
          </Button>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ContentCopyIcon />}
            sx={{ mt: 1 }}
            disabled={busy || !dayIds.length}
            onClick={() => void prepare(false)}
          >
            Copy Email
          </Button>
          <Button component={Link} to="/selections" fullWidth sx={{ mt: 1 }}>
            Edit selections
          </Button>
          <Typography sx={{ fontSize: 10, mt: 2, color: 'text.secondary' }}>
            The app prepares an email. You decide when to send it. Opening an email app does not
            confirm delivery.
          </Typography>
        </Box>
        <Box>
          {missing.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {missing.length} dates need lunch or EDP decisions. Choose fewer dates or complete the
              missing days before opening email.
            </Alert>
          )}
          {failure && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {failure}
            </Alert>
          )}
          {message && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {message}
            </Alert>
          )}
          <EmailPreview {...email} />
        </Box>
      </Box>
      <Box sx={{ mt: 5 }}>
        <Typography variant="h2" sx={{ fontSize: 27, mb: 1 }}>
          Previously prepared emails
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Exact snapshots from when you copied or opened an email. Sending status is managed in your
          email app.
        </Typography>
        {!drafts.length && (
          <Typography variant="body2" color="text.secondary">
            Your prepared emails will appear here.
          </Typography>
        )}
        {drafts.map((draft) => (
          <Box
            component="details"
            key={draft.id}
            sx={{ bgcolor: 'white', p: 2, border: '1px solid #e3e6dd', borderRadius: 2, mb: 1 }}
          >
            <Box component="summary" sx={{ cursor: 'pointer', fontSize: 13, minHeight: 32 }}>
              {new Date(draft.created_at).toLocaleString()} · {draft.service_dates.length} dates ·{' '}
              {draft.opened_at ? 'Email opening requested' : 'Copied draft'}
            </Box>
            <EmailPreview recipient={draft.recipient} subject={draft.subject} body={draft.body} />
          </Box>
        ))}
      </Box>
    </>
  );
}
