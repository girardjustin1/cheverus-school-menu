import { z } from 'zod';
import type { Child, DailyRequest, MenuMonth, Profile } from '../../types/domain';
import { breakfastLabel, dateLabel, edpLabel, mealNames } from '../../utils/plans';
export function generateEmail({ child, profile, month, requests, dayIds }: { child: Child; profile: Profile; month: MenuMonth; requests: DailyRequest[]; dayIds: string[] }) {
  const days = month.days.filter((d) => dayIds.includes(d.id));
  const subject = `${child.first_name} ${child.last_name}`.trim() + ` — ${month.title} school plans`;
  const body = [child.teacher_name ? `Hello ${child.teacher_name},` : 'Hello,', '', `Here are ${child.first_name}’s school plans for ${month.title}${child.homeroom ? ` (${child.homeroom})` : ''}:`, '', ...days.flatMap((day) => {
    if (day.no_school) return [dateLabel(day.service_date), 'No school — no services requested.', ''];
    const request = requests.find((r) => r.menu_day_id === day.id);
    return [dateLabel(day.service_date), `Lunch: ${day.lunch_available ? mealNames(day, request, 'lunch').join('; ') || 'Not selected' : 'Not available'}`, `Breakfast: ${breakfastLabel(day, request)}`, `EDP: ${edpLabel(day, request)}`, ''];
  }), 'Thank you,', profile.display_name || 'Parent'].join('\n');
  return { recipient: child.teacher_email, subject, body };
}
export function buildMailto(recipient: string, subject: string, body: string) {
  const address = z.string().email().parse(recipient.trim());
  return `mailto:${encodeURIComponent(address)}?subject=${encodeURIComponent(subject.replace(/[\r\n]/g, ' '))}&body=${encodeURIComponent(body)}`;
}
