import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box, Button, Typography } from '@mui/material';
import { DailyPlan } from './DailyPlan';
import { DateRail } from './DateRail';
import { MealOptionCard } from './MealOptionCard';
import { BreakfastSection } from '../features/breakfast/BreakfastSection';
import { EdpAttendanceSelector } from '../features/edp/EdpAttendanceSelector';
import { MonthSelectionSummary } from '../features/selections/MonthSelectionSummary';
import { EmailPreview } from '../features/email/EmailPreview';
import { emptyRequest } from '../utils/plans';
import october from '../data/october-2026.json';
import type { DailyRequest, MenuMonth } from '../types/domain';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const meta = { title: 'Day/Parent workflow', component: DailyPlan, args: { day, categories: month.categories, childName: 'Ellie', request: emptyRequest('sample', day.id), onChange: () => {} } } satisfies Meta<typeof DailyPlan>;
export default meta;
type Story = StoryObj<typeof meta>;
function Workflow() {
  const [id, setId] = useState(day.id);
  const [requests, setRequests] = useState<DailyRequest[]>([]);
  const current = month.days.find((d) => d.id === id)!;
  return <><Typography variant="h2" sx={{ mb: 2 }}>October 2026</Typography><DateRail month={month} selectedId={id} requests={requests} onSelect={setId} /><Typography variant="h3" sx={{ my: 3 }}>{current.service_date}</Typography><DailyPlan day={current} categories={month.categories} childName="Ellie" request={requests.find((r) => r.menu_day_id === id) || emptyRequest('sample', id)} onChange={(r) => setRequests((all) => [...all.filter((p) => p.menu_day_id !== r.menu_day_id), r])} /><Button sx={{ mt: 2 }} onClick={() => setId(month.days[(month.days.findIndex((d) => d.id === id) + 1) % month.days.length].id)}>Next date</Button></>;
}
export const Interactive: Story = { render: () => <Workflow /> };
export const NoSchool: Story = { args: { day: month.days.find((d) => d.no_school)!, categories: month.categories, childName: 'Ellie', request: emptyRequest('sample', day.id), onChange: () => {} } };
export const Complete: Story = { args: { day, categories: month.categories, childName: 'Ellie', request: { ...emptyRequest('sample', day.id), option_ids: [day.options[0].id], edp_status: 'attending' }, onChange: () => {} } };
export const Components: Story = { render: () => <Box sx={{ display: 'grid', gap: 3 }}><Box className="meal-grid"><MealOptionCard option={day.options[0]} onSelect={() => {}} /><MealOptionCard option={day.options[1]} selected onSelect={() => {}} /><MealOptionCard option={{ ...day.options[2], unavailable: true }} onSelect={() => {}} /></Box><BreakfastSection day={day} request={emptyRequest('sample', day.id)} categories={month.categories} onDecline={() => {}} onOptIn={() => {}} onSelect={() => {}} /><EdpAttendanceSelector childName="Ellie" available={null} value="not_answered" onChange={() => {}} /><MonthSelectionSummary month={{ ...month, days: [day] }} requests={[]} onEdit={() => {}} /><EmailPreview recipient="teacher@example.com" subject="Ellie — October 2026 school plans" body="Tuesday, October 6\nLunch: Asian Chicken\nBreakfast: Not requested\nEDP: Attending EDP" /></Box> };
