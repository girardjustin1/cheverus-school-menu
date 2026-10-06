import type { Meta, StoryObj } from '@storybook/react-vite';
import { MonthSelectionSummary } from './MonthSelectionSummary';
import october from '../../data/october-2026.json';
import type { MenuMonth } from '../../types/domain';
import { emptyRequest } from '../../utils/plans';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const meta = {
  title: 'Selections/MonthSelectionSummary',
  component: MonthSelectionSummary,
  args: { month, requests: [], onEdit: () => {} },
} satisfies Meta<typeof MonthSelectionSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NeedsAttention: Story = {};
export const MixedMonth: Story = {
  args: {
    requests: [
      {
        ...emptyRequest('sample', day.id),
        option_ids: [day.options[0].id],
        breakfast_status: 'declined',
        edp_status: 'attending',
      },
    ],
  },
};
