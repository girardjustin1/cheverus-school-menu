import { format, parseISO } from 'date-fns';
import type { DailyRequest, MenuCategory, MenuDay, MenuOption } from '../types/domain';

export const dateLabel = (date: string) => format(parseISO(date), 'EEEE, MMMM d');
export const shortDate = (date: string) => format(parseISO(date), 'MMM d');
export const todayInSchool = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export function emptyRequest(childId: string, dayId: string): DailyRequest {
  return {
    child_id: childId,
    menu_day_id: dayId,
    breakfast_status: 'not_answered',
    edp_status: 'not_answered',
    option_ids: [],
  };
}
export function selectOption(
  request: DailyRequest,
  option: MenuOption,
  category: MenuCategory,
  options: MenuOption[],
): DailyRequest {
  if (option.unavailable || category.selection_mode === 'informational') return request;
  const sameCategory = new Set(
    options.filter((o) => o.menu_category_id === category.id).map((o) => o.id),
  );
  const ids =
    category.selection_mode === 'single'
      ? [...request.option_ids.filter((id) => !sameCategory.has(id)), option.id]
      : request.option_ids.includes(option.id)
        ? request.option_ids.filter((id) => id !== option.id)
        : [...request.option_ids, option.id];
  return {
    ...request,
    option_ids: ids,
    breakfast_status:
      option.meal_type === 'breakfast'
        ? ids.some((id) => options.some((o) => o.id === id && o.meal_type === 'breakfast'))
          ? 'selected'
          : 'not_answered'
        : request.breakfast_status,
  };
}
export function declineBreakfast(request: DailyRequest, options: MenuOption[]): DailyRequest {
  return {
    ...request,
    breakfast_status: 'declined',
    option_ids: request.option_ids.filter(
      (id) => !options.some((o) => o.id === id && o.meal_type === 'breakfast'),
    ),
  };
}
export function normalizeRequestForDay(
  request: DailyRequest,
  day: MenuDay,
  categories: MenuCategory[],
): DailyRequest {
  const option_ids = request.option_ids.filter((id) => {
    const option = day.options.find((o) => o.id === id);
    if (
      !option ||
      option.unavailable ||
      categories.find((c) => c.id === option.menu_category_id)?.selection_mode === 'informational'
    )
      return false;
    return option.meal_type === 'lunch'
      ? day.lunch_available
      : day.breakfast_available &&
          day.breakfast_mode === 'choices' &&
          request.breakfast_status === 'selected';
  });
  const breakfast_status =
    !day.breakfast_available ||
    (day.breakfast_mode === 'choices' &&
      request.breakfast_status === 'selected' &&
      !option_ids.some((id) => day.options.some((o) => o.id === id && o.meal_type === 'breakfast')))
      ? 'not_answered'
      : request.breakfast_status;
  return {
    ...request,
    option_ids,
    breakfast_status,
    edp_status: day.edp_available === true ? request.edp_status : 'not_answered',
  };
}
export function completion(
  day: MenuDay,
  request: DailyRequest | undefined,
  categories: MenuCategory[],
) {
  if (day.no_school)
    return { state: 'no_school' as const, label: 'No school', missing: [] as string[] };
  const missing: string[] = [];
  if (day.lunch_available) {
    const required = categories.filter(
      (c) => c.meal_type === 'lunch' && c.required && c.selection_mode !== 'informational',
    );
    for (const category of required) {
      if (
        !day.options.some(
          (o) =>
            o.menu_category_id === category.id &&
            !o.unavailable &&
            request?.option_ids.includes(o.id),
        )
      )
        missing.push(category.name);
    }
    if (
      !required.length &&
      categories.some((c) => c.meal_type === 'lunch' && c.selection_mode !== 'informational') &&
      !day.options.some(
        (o) => o.meal_type === 'lunch' && !o.unavailable && request?.option_ids.includes(o.id),
      )
    )
      missing.push('Lunch');
  }
  if (day.edp_available === true && (!request || request.edp_status === 'not_answered'))
    missing.push('EDP attendance');
  if (day.edp_available === null) missing.push('EDP schedule confirmation');
  return {
    state: missing.length ? ('incomplete' as const) : ('complete' as const),
    label: missing.length ? 'Needs attention' : 'Day complete',
    missing,
  };
}
export function mealNames(
  day: MenuDay,
  request: DailyRequest | undefined,
  type: 'lunch' | 'breakfast',
) {
  if (!request) return [];
  return request.option_ids
    .filter((id) => day.options.some((o) => o.id === id && o.meal_type === type))
    .map(
      (id) =>
        request.option_names?.[id] ||
        day.options.find((o) => o.id === id)?.name ||
        'Previously selected item',
    );
}
export function breakfastLabel(day: MenuDay, request?: DailyRequest) {
  if (!day.breakfast_available || day.no_school) return 'Not available';
  if (!request || request.breakfast_status === 'not_answered') return 'Not requested (optional)';
  if (request.breakfast_status === 'declined') return 'Not requested';
  return mealNames(day, request, 'breakfast').join(', ') || 'Grab-and-go breakfast requested';
}
export function edpLabel(day: MenuDay, request?: DailyRequest) {
  if (day.no_school || day.edp_available === false) return 'Not available';
  if (day.edp_available === null) return 'Schedule awaiting confirmation';
  if (!request || request.edp_status === 'not_answered') return 'Not answered';
  return request.edp_status === 'attending' ? 'Attending EDP' : 'Not attending';
}
