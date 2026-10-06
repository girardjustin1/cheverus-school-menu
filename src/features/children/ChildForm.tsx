import { Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Child } from '../../types/domain';
export const childSchema = z.object({
  first_name: z.string().trim().min(1, 'Enter your child’s first name.').max(80),
  last_name: z.string().trim().max(80),
  teacher_name: z.string().trim().max(100),
  teacher_email: z.union([z.string().trim().email('Enter a valid teacher email.'), z.literal('')]),
  homeroom: z.string().trim().max(80),
});
export type ChildFields = z.infer<typeof childSchema>;
export function ChildForm({
  child,
  onSubmit,
  onCancel,
}: {
  child?: Child;
  onSubmit: (values: ChildFields) => Promise<void>;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ChildFields>({
    resolver: zodResolver(childSchema),
    defaultValues: child || {
      first_name: '',
      last_name: '',
      teacher_name: '',
      teacher_email: '',
      homeroom: '',
    },
  });
  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ p: { xs: 2.5, md: 3 }, bgcolor: 'white', border: '1px solid #e3e6dd', borderRadius: 3 }}
    >
      <Typography variant="h3" sx={{ mb: 2 }}>
        {child ? child.first_name : 'Add a child'}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {(['first_name', 'last_name', 'teacher_name', 'teacher_email', 'homeroom'] as const).map(
          (field) => (
            <TextField
              key={field}
              label={
                {
                  first_name: 'Child’s first name',
                  last_name: 'Last name (optional)',
                  teacher_name: 'Teacher name (optional)',
                  teacher_email: 'Teacher email (optional)',
                  homeroom: 'Homeroom (optional)',
                }[field]
              }
              type={field === 'teacher_email' ? 'email' : 'text'}
              autoComplete="off"
              {...register(field)}
              error={!!errors[field]}
              helperText={errors[field]?.message}
            />
          ),
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : child ? 'Save child details' : 'Add child'}
        </Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </Box>
    </Box>
  );
}
