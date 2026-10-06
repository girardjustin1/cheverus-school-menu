import { schoolApi } from './api';
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
export async function loadFamily(_userId: string, _email: string, demo: boolean): Promise<Family> {
  return demo ? demoData().family : schoolApi<Family>('family');
}
export async function loadMonths(demo: boolean): Promise<MenuMonth[]> {
  return demo ? demoData().months : schoolApi<MenuMonth[]>('menus');
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
  const { child_id, menu_day_id, breakfast_status, edp_status, option_ids } = request;
  return schoolApi<DailyRequest>('request', {
    child_id,
    menu_day_id,
    breakfast_status,
    edp_status,
    option_ids,
  });
}
export async function saveChild(child: Child, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.family.children = [...data.family.children.filter((c) => c.id !== child.id), child];
    saveDemo(data);
    return;
  }
  const { id, first_name, last_name, teacher_name, teacher_email, homeroom, active } = child;
  await schoolApi('child', {
    id,
    first_name,
    last_name,
    teacher_name,
    teacher_email,
    homeroom,
    active,
  });
}
export async function saveProfile(profile: Profile, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.family.profile.display_name = profile.display_name;
    saveDemo(data);
    return;
  }
  await schoolApi('profile', { display_name: profile.display_name });
}
export async function saveDraft(draft: EmailDraft, demo: boolean) {
  if (demo) {
    const data = demoData();
    data.family.drafts = [...data.family.drafts.filter((d) => d.id !== draft.id), draft];
    saveDemo(data);
    return;
  }
  const { id, child_id, menu_month_id, recipient, subject, body, service_dates, opened_at } = draft;
  await schoolApi('draft', {
    id,
    child_id,
    menu_month_id,
    recipient,
    subject,
    body,
    service_dates,
    opened_at,
  });
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
  await schoolApi('menu', month);
}
