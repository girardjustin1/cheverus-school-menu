import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveProvider, useAutosave, useWorkspace } from '../src/hooks/useWorkspace';
import { emptyRequest } from '../src/utils/plans';
import type { DailyRequest, Family, MenuMonth } from '../src/types/domain';
import october from '../src/data/october-2026.json';
const mocks = vi.hoisted(() => ({ save: vi.fn(), loadFamily: vi.fn(), loadMonths: vi.fn() }));
vi.mock('../src/features/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'sample-parent', email: '' }, demo: true }),
}));
vi.mock('../src/lib/repository', () => ({
  saveRequest: mocks.save,
  loadFamily: mocks.loadFamily,
  loadMonths: mocks.loadMonths,
}));
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const family: Family = {
  profile: { id: 'sample-parent', display_name: 'Justin', email: '', role: 'parent' },
  children: [],
  requests: [],
  drafts: [],
};
function Harness() {
  const autosave = useAutosave();
  const { family } = useWorkspace();
  const current =
    family.data?.requests.find((r) => r.menu_day_id === day.id) || emptyRequest('child', day.id);
  return (
    <>
      <button onClick={() => autosave.save({ ...current, option_ids: [day.options[0].id] }, day)}>
        Lunch
      </button>
      <button onClick={() => autosave.save({ ...current, edp_status: 'attending' }, day)}>
        EDP
      </button>
      <button onClick={autosave.retry}>Retry</button>
      <button
        onClick={() =>
          autosave.save(
            {
              ...emptyRequest('child', month.days[4].id),
              option_ids: [month.days[4].options[0].id],
              edp_status: 'attending',
            },
            month.days[4],
          )
        }
      >
        Other date
      </button>
      <output>{autosave.status}</output>
      <span>
        {current.option_ids.length} choices · {current.edp_status}
      </span>
      <span>{autosave.error}</span>
    </>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadFamily.mockResolvedValue(structuredClone(family));
  mocks.loadMonths.mockResolvedValue([month]);
});
function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['family', 'sample-parent', true], structuredClone(family));
  render(
    <QueryClientProvider client={client}>
      <SaveProvider>
        <Harness />
      </SaveProvider>
    </QueryClientProvider>,
  );
  return client;
}
describe('autosave ordering and recovery', () => {
  it('keeps failed choices when an unrelated family refresh returns older data', async () => {
    mocks.save.mockRejectedValue(new Error('Network unavailable'));
    const client = setup();
    fireEvent.click(screen.getByText('Lunch'));
    await waitFor(() => expect(screen.getByText('error')).toBeInTheDocument());
    await act(async () => {
      await client.invalidateQueries({ queryKey: ['family'] });
    });
    expect(screen.getByText('1 choices · not_answered')).toBeInTheDocument();
  });
  it('does not hide a failed date when a later date saves successfully', async () => {
    mocks.save
      .mockRejectedValueOnce(new Error('First date failed'))
      .mockImplementation(async (r: DailyRequest) => r);
    setup();
    fireEvent.click(screen.getByText('Lunch'));
    await waitFor(() => expect(screen.getByText('error')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Other date'));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.getByText('First date failed')).toBeInTheDocument());
    expect(screen.getByText('error')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('saved')).toBeInTheDocument());
  });
  it('retains failed intended choices and retries them explicitly', async () => {
    mocks.save
      .mockRejectedValueOnce(new Error('Network unavailable'))
      .mockImplementation(async (r: DailyRequest) => ({
        ...r,
        updated_at: '2026-10-06T12:00:00Z',
      }));
    setup();
    fireEvent.click(screen.getByText('Lunch'));
    await waitFor(() => expect(screen.getByText('error')).toBeInTheDocument());
    expect(screen.getByText('1 choices · not_answered')).toBeInTheDocument();
    expect(screen.getByText('Network unavailable')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(screen.getByText('saved')).toBeInTheDocument());
    expect(mocks.save).toHaveBeenCalledTimes(2);
  });
  it('serializes rapid changes and does not replace newer optimistic decisions with an old response', async () => {
    let resolveFirst: (value: DailyRequest) => void = () => {};
    mocks.save
      .mockImplementationOnce(
        () =>
          new Promise<DailyRequest>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockImplementation(async (r: DailyRequest) => r);
    setup();
    fireEvent.click(screen.getByText('Lunch'));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByText('EDP'));
    expect(screen.getByText('1 choices · attending')).toBeInTheDocument();
    expect(mocks.save).toHaveBeenCalledTimes(1);
    await act(async () =>
      resolveFirst({ ...emptyRequest('child', day.id), option_ids: [day.options[0].id] }),
    );
    await waitFor(() => expect(screen.getByText('saved')).toBeInTheDocument());
    expect(screen.getByText('1 choices · attending')).toBeInTheDocument();
    expect(mocks.save.mock.calls[1][0]).toMatchObject({
      option_ids: [day.options[0].id],
      edp_status: 'attending',
    });
  });
});
