import type { Meta, StoryObj } from '@storybook/react-vite';
import { DayEditor } from './AdminPage';
import october from '../../data/october-2026.json';
import type { MenuMonth } from '../../types/domain';
const month = october as MenuMonth;
const meta = {
  title: 'Admin/MenuDayEditor',
  component: DayEditor,
  args: {
    day: month.days.find((d) => d.service_date === '2026-10-06')!,
    categories: month.categories,
    onChange: () => {},
  },
} satisfies Meta<typeof DayEditor>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SchoolDay: Story = {};
export const NoSchool: Story = { args: { day: month.days.find((d) => d.no_school)! } };
