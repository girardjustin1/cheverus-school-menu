import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../features/auth/AuthProvider';
import { loadFamily, loadMonths, saveRequest } from '../lib/repository';
import type { DailyRequest, Family, MenuDay } from '../types/domain';
export function useWorkspace() {
  const { user, demo } = useAuth();
  const key = ['family', user?.id, demo] as const;
  const family = useQuery({
    queryKey: key,
    queryFn: () => loadFamily(user!.id, user!.email, demo),
    enabled: !!user,
  });
  const months = useQuery({
    queryKey: ['months', user?.id, demo],
    queryFn: () => loadMonths(demo),
    enabled: !!user,
  });
  return { family, months, familyKey: key, demo };
}
function useAutosaveCore() {
  const { familyKey, demo } = useWorkspace();
  const queryClient = useQueryClient();
  const queue = useRef(Promise.resolve());
  const pending = useRef(
    new Map<string, { request: DailyRequest; day: MenuDay; version: number }>(),
  );
  const version = useRef(0);
  const failures = useRef(new Map<string, string>());
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState('');
  useEffect(
    () =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type !== 'updated' ||
          event.action.type !== 'success' ||
          !pending.current.size ||
          event.query.queryKey[0] !== 'family' ||
          event.query.queryKey[1] !== familyKey[1] ||
          event.query.queryKey[2] !== demo
        )
          return;
        const family = event.query.state.data as Family | undefined;
        if (!family) return;
        const overlay = [...pending.current.values()].map((p) => p.request);
        const needsOverlay = overlay.some((request) => {
          const current = family.requests.find(
            (r) => r.child_id === request.child_id && r.menu_day_id === request.menu_day_id,
          );
          return (
            !current ||
            current.breakfast_status !== request.breakfast_status ||
            current.edp_status !== request.edp_status ||
            JSON.stringify(current.option_ids) !== JSON.stringify(request.option_ids)
          );
        });
        if (needsOverlay)
          queryClient.setQueryData<Family>(familyKey, {
            ...family,
            requests: [
              ...family.requests.filter(
                (r) =>
                  !overlay.some(
                    (p) => p.child_id === r.child_id && p.menu_day_id === r.menu_day_id,
                  ),
              ),
              ...overlay,
            ],
          });
      }),
    [queryClient, familyKey, demo],
  );
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (pending.current.size) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);
  const put = useCallback(
    (request: DailyRequest) => {
      void queryClient.cancelQueries({ queryKey: familyKey }, { revert: false });
      queryClient.setQueryData<Family>(familyKey, (family) =>
        family
          ? {
              ...family,
              requests: [
                ...family.requests.filter(
                  (r) => r.child_id !== request.child_id || r.menu_day_id !== request.menu_day_id,
                ),
                request,
              ],
            }
          : family,
      );
    },
    [queryClient, familyKey],
  );
  const enqueue = (request: DailyRequest, day: MenuDay) => {
    const saveKey = `${request.child_id}:${request.menu_day_id}`;
    const v = ++version.current;
    pending.current.set(saveKey, { request, day, version: v });
    failures.current.delete(saveKey);
    put(request);
    setStatus(failures.current.size ? 'error' : 'saving');
    setError([...failures.current.values()][0] || '');
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        try {
          const saved = await saveRequest(request, day, demo);
          if (pending.current.get(saveKey)?.version === v) {
            pending.current.delete(saveKey);
            put(saved);
          }
          if (!pending.current.size) {
            setStatus('saved');
            setError('');
          } else if (failures.current.size) {
            setStatus('error');
            setError([...failures.current.values()][0]);
          }
        } catch (err) {
          if (pending.current.get(saveKey)?.version === v) {
            const message = err instanceof Error ? err.message : 'Unable to save.';
            failures.current.set(saveKey, message);
            setError(message);
            setStatus('error');
          }
        }
      });
  };
  const retry = () => {
    const failed = [...pending.current.values()];
    failed.forEach(({ request, day }) => enqueue(request, day));
  };
  const flush = async () => {
    await queue.current;
    if (pending.current.size)
      throw new Error('Some selections have not saved. Retry before continuing.');
  };
  return { save: enqueue, retry, flush, status, error, hasPending: () => pending.current.size > 0 };
}
const SaveContext = createContext<ReturnType<typeof useAutosaveCore> | null>(null);
export function SaveProvider({ children }: { children: ReactNode }) {
  const autosave = useAutosaveCore();
  return createElement(SaveContext.Provider, { value: autosave }, children);
}
export function useAutosave() {
  const value = useContext(SaveContext);
  if (!value) throw new Error('SaveProvider missing');
  return value;
}
