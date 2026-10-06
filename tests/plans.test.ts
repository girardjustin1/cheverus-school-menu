import { describe, expect, it } from 'vitest';
import october from '../src/data/october-2026.json';
import {
  completion,
  declineBreakfast,
  emptyRequest,
  normalizeRequestForDay,
  selectOption,
} from '../src/utils/plans';
import { createMonth, publicationIssues } from '../src/utils/menuBuilder';
import { generateEmail, buildMailto } from '../src/features/email/generateEmail';
import type { Child, MenuMonth, Profile } from '../src/types/domain';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const lunch = month.categories[0];
const initial = emptyRequest('child', day.id);
const child: Child = {
  id: 'child',
  parent_user_id: 'parent',
  first_name: 'Ellie',
  last_name: '',
  teacher_name: 'Mrs. Smith',
  teacher_email: 'teacher@example.com',
  homeroom: 'Room 4',
  active: true,
};
const profile: Profile = { id: 'parent', display_name: 'Justin', email: '', role: 'parent' };
describe('daily decision rules', () => {
  it('information-only categories do not require a food selection', () => {
    const categories = month.categories.map((c) =>
      c.meal_type === 'lunch'
        ? { ...c, required: false, selection_mode: 'informational' as const }
        : c,
    );
    expect(completion({ ...day, edp_available: false }, initial, categories).state).toBe(
      'complete',
    );
  });
  it('reviews changed services without mutating previously saved history', () => {
    const request = {
      ...initial,
      option_ids: [day.options[0].id],
      breakfast_status: 'selected' as const,
      edp_status: 'attending' as const,
    };
    const edited = {
      ...day,
      breakfast_available: false,
      edp_available: false,
      options: day.options.map((o) => ({ ...o, unavailable: true })),
    };
    expect(normalizeRequestForDay(request, edited, month.categories)).toMatchObject({
      option_ids: [],
      breakfast_status: 'not_answered',
      edp_status: 'not_answered',
    });
    expect(request).toMatchObject({
      option_ids: [day.options[0].id],
      breakfast_status: 'selected',
      edp_status: 'attending',
    });
  });
  it('selects a lunch and replaces a single choice', () => {
    const first = selectOption(initial, day.options[0], lunch, day.options);
    expect(first.option_ids).toEqual([day.options[0].id]);
    const next = selectOption(first, day.options[1], lunch, day.options);
    expect(next.option_ids).toEqual([day.options[1].id]);
  });
  it('allows multiple selections only for a multiple category', () => {
    const category = { ...lunch, selection_mode: 'multiple' as const };
    const first = selectOption(initial, day.options[0], category, day.options);
    expect(selectOption(first, day.options[1], category, day.options).option_ids).toHaveLength(2);
    expect(selectOption(first, day.options[0], category, day.options).option_ids).toHaveLength(0);
  });
  it('rejects unavailable and informational options', () => {
    expect(
      selectOption(initial, { ...day.options[0], unavailable: true }, lunch, day.options),
    ).toEqual(initial);
    expect(
      selectOption(
        initial,
        day.options[0],
        { ...lunch, selection_mode: 'informational' },
        day.options,
      ),
    ).toEqual(initial);
  });
  it('optional breakfast never prevents completion', () => {
    const request = {
      ...initial,
      option_ids: [day.options[0].id],
      edp_status: 'not_attending' as const,
    };
    expect(completion(day, request, month.categories).state).toBe('complete');
    expect(
      completion(day, { ...request, breakfast_status: 'declined' }, month.categories).state,
    ).toBe('complete');
  });
  it('unanswered EDP is different from no EDP', () => {
    const request = { ...initial, option_ids: [day.options[0].id] };
    expect(completion(day, request, month.categories).missing).toContain('EDP attendance');
    expect(completion(day, { ...request, edp_status: 'attending' }, month.categories).state).toBe(
      'complete',
    );
    expect(
      completion(day, { ...request, edp_status: 'not_attending' }, month.categories).state,
    ).toBe('complete');
  });
  it('unavailable EDP does not require an attendance answer; unconfirmed does', () => {
    const request = { ...initial, option_ids: [day.options[0].id] };
    expect(completion({ ...day, edp_available: false }, request, month.categories).state).toBe(
      'complete',
    );
    expect(
      completion({ ...day, edp_available: null }, request, month.categories).missing,
    ).toContain('EDP schedule confirmation');
  });
  it('no-school dates need no choices', () => {
    expect(
      completion(
        month.days.find((d) => d.no_school)!,
        undefined,
        month.categories,
      ).state,
    ).toBe('no_school');
  });
  it('breakfast choice sets selected and decline clears breakfast alone', () => {
    const category = month.categories[1];
    const option = {
      ...day.options[0],
      id: 'breakfast',
      menu_category_id: category.id,
      meal_type: 'breakfast' as const,
      name: 'Source-confirmed test breakfast',
    };
    const options = [...day.options, option];
    const withLunch = selectOption(initial, day.options[0], lunch, options);
    const selected = selectOption(withLunch, option, category, options);
    expect(selected.breakfast_status).toBe('selected');
    expect(declineBreakfast(selected, options)).toMatchObject({
      breakfast_status: 'declined',
      option_ids: [day.options[0].id],
    });
  });
  it('requires each required lunch category and treats retired choices as incomplete', () => {
    const request = {
      ...initial,
      option_ids: [day.options[0].id],
      edp_status: 'attending' as const,
    };
    expect(
      completion(
        { ...day, options: day.options.map((o) => ({ ...o, unavailable: true })) },
        request,
        month.categories,
      ).state,
    ).toBe('incomplete');
    expect(
      completion(day, request, [...month.categories, { ...lunch, id: 'side', name: 'Side' }])
        .missing,
    ).toContain('Side');
  });
});
describe('source and future months', () => {
  it('contains actual October weekdays, daily alternatives, and confirmed EDP hours', () => {
    expect(month.days).toHaveLength(22);
    expect(month.days.filter((d) => !d.no_school)).toHaveLength(21);
    expect(day.options.map((o) => o.name)).toEqual([
      'Asian Chicken',
      'Jammie Sunbutter and Jelly Sandwich',
      'American Cheese on Wheat Bread',
    ]);
    expect(
      month.days
        .filter((d) => !d.no_school)
        .every((d) => d.edp_available === true && d.edp_note.includes('2–6 pm')),
    ).toBe(true);
    expect(month.days.flatMap((d) => d.options).some((o) => o.meal_type === 'breakfast')).toBe(
      false,
    );
  });
  it('creates November weekdays and copies structure without food by default', () => {
    const next = createMonth(2026, 11, month);
    expect(next.days).toHaveLength(21);
    expect(next.status).toBe('draft');
    expect(next.days.every((d) => d.options.length === 0 && d.edp_available === true)).toBe(true);
    expect(next.days[0].service_date).toBe('2026-11-02');
    expect(next.categories[0].id).not.toBe(month.categories[0].id);
    expect(publicationIssues(next)).not.toHaveLength(0);
  });
  it('food duplication is explicit and gives all records fresh IDs', () => {
    const next = createMonth(2026, 11, month, true);
    expect(next.days[0].options[0].name).toBe('Meatball Sub');
    expect(next.days[0].options[0].menu_day_id).toBe(next.days[0].id);
    expect(next.days[0].options[0].menu_category_id).toBe(next.categories[0].id);
    expect(publicationIssues(next)).toHaveLength(0);
  });
});
describe('email and selection history', () => {
  it('includes lunch, optional breakfast, EDP, and a readable date', () => {
    const request = {
      ...initial,
      option_ids: [day.options[0].id],
      edp_status: 'attending' as const,
    };
    const email = generateEmail({ child, profile, month, requests: [request], dayIds: [day.id] });
    expect(email.recipient).toBe('teacher@example.com');
    expect(email.body).toContain('Tuesday, October 6');
    expect(email.body).toContain('Lunch: Asian Chicken');
    expect(email.body).toContain('Breakfast: Not requested');
    expect(email.body).toContain('EDP: Attending EDP');
    expect(email.body).toContain('Justin');
  });
  it('makes missing answers, no school, and unavailable EDP explicit', () => {
    const noSchool = month.days.find((d) => d.no_school)!;
    const email = generateEmail({
      child,
      profile,
      month: { ...month, days: [{ ...day, edp_available: false }, noSchool] },
      requests: [],
      dayIds: [day.id, noSchool.id],
    });
    expect(email.body).toContain('Lunch: Not selected');
    expect(email.body).toContain('EDP: Not available');
    expect(email.body).toContain('No school — no services requested');
  });
  it('keeps the saved menu name for month history and emails after a menu edit', () => {
    const request = {
      ...initial,
      option_ids: [day.options[0].id],
      option_names: { [day.options[0].id]: 'Asian Chicken (original request)' },
      edp_status: 'not_attending' as const,
    };
    const changed = {
      ...month,
      days: [{ ...day, options: day.options.map((o) => ({ ...o, name: 'Edited later' })) }],
    };
    const email = generateEmail({
      child,
      profile,
      month: changed,
      requests: [request],
      dayIds: [day.id],
    });
    expect(email.body).toContain('Asian Chicken (original request)');
    expect(email.body).not.toContain('Edited later');
  });
  it('encodes mailto without introducing additional parameters', () => {
    const url = buildMailto('teacher@example.com', 'Lunch & EDP?', 'A+B\n&bcc=other@example.com');
    expect(url).toBe(
      'mailto:teacher%40example.com?subject=Lunch%20%26%20EDP%3F&body=A%2BB%0A%26bcc%3Dother%40example.com',
    );
    expect(() => buildMailto('bad\r\nbcc:test@example.com', 'x', 'y')).toThrow();
  });
});
