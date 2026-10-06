import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { useSchool } from '../../app/WorkspaceContext';
import { useAuth } from '../auth/AuthProvider';
import { useAutosave, useWorkspace } from '../../hooks/useWorkspace';
import { resetDemo, saveChild, saveProfile } from '../../lib/repository';
import { ChildForm, type ChildFields } from './ChildForm';
const profileSchema = z.object({
  display_name: z.string().trim().min(1, 'Enter your name.').max(100),
});
export function ProfilePage() {
  const { family, demo } = useSchool();
  const { signOut } = useAuth();
  const autosave = useAutosave();
  const { familyKey } = useWorkspace();
  const client = useQueryClient();
  const [adding, setAdding] = useState(!family.children.length);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { display_name: family.profile.display_name },
  });
  const refresh = () => client.invalidateQueries({ queryKey: familyKey });
  const updateChild = async (values: ChildFields, id: string = crypto.randomUUID()) => {
    setError('');
    try {
      await saveChild({ ...values, id, parent_user_id: family.profile.id, active: true }, demo);
      await refresh();
      setAdding(false);
      setFeedback('Child details saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save child.');
    }
  };
  const logout = async () => {
    try {
      await autosave.flush();
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign out.');
    }
  };
  return (
    <Box sx={{ maxWidth: 800 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Keep only the details needed to plan the school day and address your email.
      </Typography>
      {demo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Demo data stays on this device. Use sample details here.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {feedback && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setFeedback('')}>
          {feedback}
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={handleSubmit(async ({ display_name }) => {
          try {
            await saveProfile({ ...family.profile, display_name }, demo);
            await refresh();
            setFeedback('Parent details saved.');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not save name.');
          }
        })}
        sx={{ p: 3, bgcolor: 'white', border: '1px solid #e3e6dd', borderRadius: 3, mb: 3 }}
      >
        <Typography variant="h3" sx={{ mb: 2 }}>
          Parent details
        </Typography>
        <TextField
          label="Parent name"
          {...register('display_name')}
          error={!!errors.display_name}
          helperText={errors.display_name?.message}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {family.profile.email}
        </Typography>
        <Button type="submit" variant="outlined" sx={{ mt: 2 }} disabled={isSubmitting}>
          Save parent details
        </Button>
      </Box>
      <Box sx={{ display: 'grid', gap: 3 }}>
        {family.children.map((child) => (
          <ChildForm
            key={child.id}
            child={child}
            onSubmit={(values) => updateChild(values, child.id)}
          />
        ))}
        {adding && (
          <ChildForm
            onSubmit={(values) => updateChild(values)}
            onCancel={family.children.length ? () => setAdding(false) : undefined}
          />
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
        {!adding && (
          <Button variant="outlined" onClick={() => setAdding(true)}>
            Add another child
          </Button>
        )}
        <Button
          onClick={() => void logout()}
          disabled={autosave.status === 'saving' || autosave.status === 'error'}
        >
          {demo ? 'Leave demo' : 'Sign out'}
        </Button>
        {family.profile.role === 'admin' && (
          <Button component={Link} to="/admin/menus">
            Manage school menus
          </Button>
        )}
        {demo && (
          <Button
            onClick={() => {
              resetDemo();
              client.clear();
              window.location.reload();
            }}
          >
            Reset demo data
          </Button>
        )}
      </Box>
    </Box>
  );
}
