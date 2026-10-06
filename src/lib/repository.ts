import { supabase } from './supabase/client';
import october from '../data/october-2026.json';
import type {
  Child,
  DailyRequest,
  EmailDraft,
  Family,
  MenuDay,
  MenuMonth,
  Profile,
} from '../types/domain';

const DEMO_KEY = 'cheverus.sample.v1';
interface DemoData {
  family: Family;
  months: MenuMonth[];
}
function initialDemo(): DemoData {
  return {
    family: {
      profile: { id: 'sample-parent', display_name: 'Justin', email: '', role: 'admin' },
      children: [
        {
          id: 'sample-child',
          parent_user_id: 'sample-parent',
          first_name: 'Ellie',
          last_name: '',
          teacher_name: '',
          teacher_email: '',
          homeroom: '',
          active: true,
        },
      ],
      requests: [],
      drafts: [],
    },
    months: [{ ...structuredClone(october), status: 'published' } as MenuMonth],
  };
}
function demoData(): DemoData {
  const raw = localStorage.getItem(DEMO_KEY);
  return raw ? JSON.parse(raw) : initialDemo();
}
function saveDemo(data: DemoData) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}
export function resetDemo() {
  localStorage.removeItem(DEMO_KEY);
}
function db() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function loadFamily(userId: string, email: string, demo: boolean): Promise<Family> {
  if (demo) return demoData().family;
  const { data: foundProfile, error } = await db()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  let profile = foundProfile;
  check(error);
  if (!profile) {
    const result = await db()
      .from('profiles')
      .insert({ id: userId, email, display_name: '' })
      .select()
      .single();
    check(result.error);
    profile = result.data;
  }
  const [children, requests, selections, drafts] = await Promise.all([
    db().from('children').select('*').eq('active', true).order('created_at'),
    db().from('daily_requests').select('*'),
    db().from('meal_selections').select('*'),
    db().from('email_drafts').select('*').order('created_at', { ascending: false }),
  ]);
  [children, requests, selections, drafts].forEach((r) => check(r.error));
  return {
    profile: profile as Profile,
    children: children.data as Child[],
    drafts: drafts.data as EmailDraft[],
    requests: (requests.data || []).map((r) => {
      const selected = (selections.data || []).filter(
        (s) => s.child_id === r.child_id && s.menu_day_id === r.menu_day_id,
      );
      return {
        ...r,
        option_ids: selected.map((s) => s.menu_option_id),
        option_names: Object.fromEntries(
          selected.map((s) => [s.menu_option_id, s.option_name_snapshot]),
        ),
      } as DailyRequest;
    }),
  };
}
export async function loadMonths(demo: boolean): Promise<MenuMonth[]> {
  if (demo) return demoData().months;
  const result = await db()
    .from('menu_months')
    .select('*, categories:menu_categories(*), days:menu_days(*, options:menu_options(*))')
    .order('year')
    .order('month');
  check(result.error);
  return (result.data as MenuMonth[]).map((m) => ({
    ...m,
    categories: m.categories.sort((a, b) => a.sort_order - b.sort_order),
    days: m.days
      .sort((a, b) => a.service_date.localeCompare(b.service_date))
      .map((d) => ({ ...d, options: d.options.sort((a, b) => a.sort_order - b.sort_order) })),
  }));
}
export async function saveRequest(request: DailyRequest, day: MenuDay, demo: boolean) {
  if (demo) {
    const data = demoData();
    const saved: DailyRequest = {
      ...request,
      updated_at: new Date().toISOString(),
      option_names: Object.fromEntries(
        day.options.filter((o) => request.option_ids.includes(o.id)).map((o) => [o.id, o.name]),
      ),
    };
    data.family.requests = [
      ...data.family.requests.filter(
        (r) => r.child_id !== request.child_id || r.menu_day_id !== request.menu_day_id,
      ),
      saved,
    ];
    saveDemo(data);
    return saved;
  }
  const result = await db().rpc('save_daily_request', {
    p_child_id: request.child_id,
    p_menu_day_id: request.menu_day_id,
    p_breakfast_status: request.breakfast_status,
    p_edp_status: request.edp_status,
    p_option_ids: request.option_ids,
  });
  check(result.error);
  return {
    ...request,
    updated_at: new Date().toISOString(),
    option_names: Object.fromEntries(
      day.options.filter((o) => request.option_ids.includes(o.id)).map((o) => [o.id, o.name]),
    ),
  };
}
export async function saveChild(child: Child, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.family.children = [...data.family.children.filter((c) => c.id !== child.id), child];
    saveDemo(data);
    return;
  }
  check((await db().from('children').upsert(child)).error);
}
export async function saveProfile(profile: Profile, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.family.profile.display_name = profile.display_name;
    saveDemo(data);
    return;
  }
  check(
    (
      await db()
        .from('profiles')
        .update({ display_name: profile.display_name })
        .eq('id', profile.id)
    ).error,
  );
}
export async function saveDraft(draft: EmailDraft, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.family.drafts = [...data.family.drafts.filter((d) => d.id !== draft.id), draft];
    saveDemo(data);
    return;
  }
  check(
    (
      await db()
        .from('email_drafts')
        .insert({ ...draft, user_id: (await db().auth.getUser()).data.user?.id })
    ).error,
  );
}
export async function saveMenu(month: MenuMonth, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.months = [...data.months.filter((m) => m.id !== month.id), month].sort(
      (a, b) => a.year - b.year || a.month - b.month,
    );
    saveDemo(data);
    return;
  }
  check((await db().rpc('save_menu_month', { p_menu: month })).error);
}
