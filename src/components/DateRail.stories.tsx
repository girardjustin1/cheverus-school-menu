import type { Meta, StoryObj } from '@storybook/react-vite';
import { DateRail } from './DateRail';
import october from '../data/october-2026.json';
import type { MenuMonth } from '../types/domain';
import { emptyRequest } from '../utils/plans';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const meta = {
  title: 'Navigation/DateRail',
  component: DateRail,
  args: { month, selectedId: day.id, requests: [], onSelect: () => {} },
} satisfies Meta<typeof DateRail>;
export default meta;
type Story = StoryObj<typeof meta>;
export const October: Story = {};
export const CompletedDate: Story = {
  args: {
    requests: [
      {
        ...emptyRequest('sample', day.id),
        option_ids: [day.options[0].id],
        edp_status: 'attending',
      },
    ],
  },
};
export const NoSchoolSelected: Story = {
  args: { selectedId: month.days.find((d) => d.no_school)!.id },
};
