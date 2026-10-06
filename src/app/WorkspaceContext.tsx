import { createContext, useContext, useState, type ReactNode } from 'react';
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useWorkspace } from '../hooks/useWorkspace';
import { todayInSchool } from '../utils/plans';
import type { Child, DailyRequest, Family, MenuMonth } from '../types/domain';
interface WorkspaceValue {
  family: Family;
  months: MenuMonth[];
  month?: MenuMonth;
  child?: Child;
  requests: DailyRequest[];
  setChildId: (id: string) => void;
  setMonthId: (id: string) => void;
  demo: boolean;
}
const Context = createContext<WorkspaceValue | null>(null);
export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { family, months, demo } = useWorkspace();
  const [childId, setChildId] = useState('');
  const [monthId, setMonthId] = useState('');
  if (family.isPending || months.isPending)
    return (
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Getting your school plans ready…</Typography>
      </Box>
    );
  if (family.error || months.error)
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 4 }}>
        <Alert severity="error">{family.error?.message || months.error?.message}</Alert>
        <Button
          sx={{ mt: 2 }}
          onClick={() => {
            void family.refetch();
            void months.refetch();
          }}
        >
          Try again
        </Button>
        <Button component={Link} to="/login">
          Return to sign in
        </Button>
      </Box>
    );
  const child = family.data.children.find((c) => c.id === childId) || family.data.children[0];
  const published = months.data.filter((m) => m.status === 'published');
  const month =
    months.data.find((m) => m.id === monthId) ||
    published.find(
      (m) => `${m.year}-${String(m.month).padStart(2, '0')}` === todayInSchool().slice(0, 7),
    ) ||
    published[published.length - 1] ||
    months.data[months.data.length - 1];
  return (
    <Context.Provider
      value={{
        family: family.data,
        months: months.data,
        month,
        child,
        requests: family.data.requests.filter((r) => r.child_id === child?.id),
        setChildId,
        setMonthId,
        demo,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useSchool() {
  const context = useContext(Context);
  if (!context) throw new Error('WorkspaceProvider missing');
  return context;
}
