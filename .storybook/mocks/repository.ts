import october from '../../src/data/october-2026.json';
import { emptyRequest } from '../../src/utils/plans';
import type {
  Child,
  DailyRequest,
  EmailDraft,
  Family,
  MenuDay,
  MenuMonth,
  Profile,
} from '../../src/types/domain';

export type PrototypeScenario = 'daily' | 'review' | 'email' | 'empty-family' | 'save-error';

let family: Family;
let months: MenuMonth[];
let failNextSave = false;
let generation = 0;

export function resetPrototype(scenario: PrototypeScenario = 'daily', admin = false) {
  generation += 1;
  months = [{ ...structuredClone(october), status: 'published' } as MenuMonth];
  family = {
    profile: {
      id: 'prototype-parent',
      display_name: 'Justin',
      email: 'parent@example.com',
      role: admin ? 'admin' : 'parent',
    },
    children:
      scenario === 'empty-family'
        ? []
        : [
            {
              id: 'prototype-child',
              parent_user_id: 'prototype-parent',
              first_name: 'Ellie',
              last_name: '',
              teacher_name: 'Sample teacher',
              teacher_email: 'teacher@example.com',
              homeroom: '',
              active: true,
            },
          ],
    requests: [],
    drafts: [],
  };
  const days = months[0].days.filter((day) => !day.no_school);
  const seeded =
    scenario === 'email'
      ? days
      : scenario === 'review'
        ? days.slice(0, 5)
        : days.filter((day) => day.service_date === '2026-10-05');
  family.requests = seeded.map((day, index) => ({
    ...emptyRequest('prototype-child', day.id),
    option_ids: [day.options[0].id],
    option_names: { [day.options[0].id]: day.options[0].name },
    breakfast_status: index % 2 ? 'selected' : 'declined',
    edp_status: index % 2 ? 'not_attending' : 'attending',
  }));
  if (scenario === 'review' && family.requests[4]) family.requests[4].edp_status = 'not_answered';
  failNextSave = scenario === 'save-error';
  sessionStorage.removeItem('cheverus.admin-draft:prototype-parent:true');
}

resetPrototype();

export function resetDemo() {
  resetPrototype();
}
export async function loadFamily(): Promise<Family> {
  return structuredClone(family);
}
export async function loadMonths(): Promise<MenuMonth[]> {
  return structuredClone(months);
}
export async function saveRequest(request: DailyRequest, day: MenuDay) {
  const startedAt = generation;
  await new Promise((resolve) => setTimeout(resolve, 250));
  // A save from an unmounted/reset story must not change the new scenario.
  if (startedAt !== generation) return structuredClone(request);
  if (failNextSave) {
    failNextSave = false;
    throw new Error('Sample connection interruption. Try Retry save.');
  }
  const saved = {
    ...structuredClone(request),
    updated_at: new Date().toISOString(),
    option_names: Object.fromEntries(
      day.options
        .filter((option) => request.option_ids.includes(option.id))
        .map((option) => [option.id, option.name]),
    ),
  };
  family.requests = [
    ...family.requests.filter(
      (previous) =>
        previous.child_id !== request.child_id || previous.menu_day_id !== request.menu_day_id,
    ),
    saved,
  ];
  return structuredClone(saved);
}
export async function saveChild(child: Child) {
  family.children = [
    ...family.children.filter((previous) => previous.id !== child.id),
    structuredClone(child),
  ];
}
export async function saveProfile(profile: Profile) {
  family.profile.display_name = profile.display_name;
}
export async function saveDraft(draft: EmailDraft) {
  family.drafts = [...family.drafts, structuredClone(draft)];
}
export async function saveMenu(month: MenuMonth) {
  months = [...months.filter((previous) => previous.id !== month.id), structuredClone(month)].sort(
    (a, b) => a.year - b.year || a.month - b.month,
  );
}
