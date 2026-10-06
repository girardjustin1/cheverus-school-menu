import { eachDayOfInterval, endOfMonth, format, getISODay, isWeekend } from 'date-fns';
import type { MenuCategory, MenuDay, MenuMonth } from '../types/domain';
export function createMonth(year: number, month: number, template?: MenuMonth, copyFood = false): MenuMonth {
  const id = crypto.randomUUID();
  const start = new Date(year, month - 1, 1);
  const categories: MenuCategory[] = template
    ? template.categories.map((c) => ({ ...c, id: crypto.randomUUID(), menu_month_id: id }))
    : [
      { id: crypto.randomUUID(), menu_month_id: id, meal_type: 'lunch', name: 'Lunch', description: 'Choose your lunch.', selection_mode: 'single', required: true, sort_order: 0 },
      { id: crypto.randomUUID(), menu_month_id: id, meal_type: 'breakfast', name: 'Breakfast', description: 'Optional school breakfast.', selection_mode: 'single', required: false, sort_order: 1 },
    ];
  const days: MenuDay[] = eachDayOfInterval({ start, end: endOfMonth(start) }).filter((d) => !isWeekend(d)).map((d, i) => {
    const weekday = getISODay(d);
    const prior = template?.days.find((p) => p.weekday === weekday && !p.no_school);
    const dayId = crypto.randomUUID();
    return { id: dayId, menu_month_id: id, service_date: format(d, 'yyyy-MM-dd'), weekday, title: '', note: '', no_school: false, breakfast_available: prior?.breakfast_available ?? false, breakfast_mode: prior?.breakfast_mode ?? 'opt_in', lunch_available: prior?.lunch_available ?? true, edp_available: prior?.edp_available ?? null, edp_note: prior?.edp_note ?? '', sort_order: i,
      options: copyFood && prior ? prior.options.map((o) => ({ ...o, id: crypto.randomUUID(), menu_day_id: dayId, menu_category_id: categories[template!.categories.findIndex((c) => c.id === o.menu_category_id)].id })) : [] };
  });
  return { id, school_year: `${month >= 8 ? year : year - 1}–${month >= 8 ? year + 1 : year}`, year, month, title: format(start, 'MMMM yyyy'), description: 'School meals & Extended Day', status: 'draft', source_reference: template ? `Structure duplicated from ${template.title}` : '', categories, days };
}
export function publicationIssues(month: MenuMonth) {
  const issues: string[] = [];
  for (const day of month.days.filter((d) => !d.no_school)) {
    if (day.edp_available === null) issues.push(`${day.service_date}: confirm EDP availability.`);
    if (day.lunch_available && !day.options.some((o) => o.meal_type === 'lunch' && !o.unavailable)) issues.push(`${day.service_date}: add lunch options or disable lunch.`);
    for (const category of month.categories.filter((c) => c.meal_type === 'lunch' && c.required && c.selection_mode !== 'informational')) {
      if (day.lunch_available && !day.options.some((o) => o.menu_category_id === category.id && !o.unavailable)) issues.push(`${day.service_date}: ${category.name} has no available options.`);
    }
    if (day.breakfast_available && day.breakfast_mode === 'choices' && !day.options.some((o) => o.meal_type === 'breakfast' && !o.unavailable)) issues.push(`${day.service_date}: add breakfast options or use participation only.`);
  }
  return [...new Set(issues)];
}
