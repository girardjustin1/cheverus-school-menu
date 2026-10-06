import type { Meta, StoryObj } from '@storybook/react-vite';
import { BreakfastSection } from './BreakfastSection';
import october from '../../data/october-2026.json';
import { emptyRequest } from '../../utils/plans';
import type { MenuMonth } from '../../types/domain';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const request = emptyRequest('sample', day.id);
const meta = {
  title: 'Meals/BreakfastSection',
  component: BreakfastSection,
  args: {
    day,
    request,
    categories: month.categories,
    onDecline: () => {},
    onOptIn: () => {},
    onSelect: () => {},
  },
} satisfies Meta<typeof BreakfastSection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const OctoberParticipation: Story = {};
export const Selected: Story = { args: { request: { ...request, breakfast_status: 'selected' } } };
export const Declined: Story = { args: { request: { ...request, breakfast_status: 'declined' } } };
export const Unavailable: Story = { args: { day: { ...day, breakfast_available: false } } };
export const NoOptionsConfigured: Story = { args: { day: { ...day, breakfast_mode: 'choices' } } };
// Demonstrates future admin configuration using a general source example. Not an October daily guarantee.
export const FutureItemConfiguration: Story = {
  args: {
    day: {
      ...day,
      breakfast_mode: 'choices',
      options: [
        ...day.options,
        {
          ...day.options[0],
          id: 'example-cereal',
          name: 'Cereal',
          description: 'Example item-based configuration; not a guaranteed October item.',
          meal_type: 'breakfast',
          menu_category_id: month.categories[1].id,
        },
      ],
    },
  },
};
