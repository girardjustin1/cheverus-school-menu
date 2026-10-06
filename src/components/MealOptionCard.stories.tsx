import type { Meta, StoryObj } from '@storybook/react-vite';
import { MealOptionCard } from './MealOptionCard';
import october from '../data/october-2026.json';
import type { MenuMonth } from '../types/domain';
const month = october as MenuMonth;
const option = month.days.find((d) => d.service_date === '2026-10-06')!.options[0];
const meta = {
  title: 'Meals/MealOptionCard',
  component: MealOptionCard,
  args: { option, onSelect: () => {} },
} satisfies Meta<typeof MealOptionCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Selected: Story = { args: { selected: true } };
export const Unavailable: Story = { args: { option: { ...option, unavailable: true } } };
export const Disabled: Story = { args: { disabled: true } };
export const LongContent: Story = {
  args: { option: month.days.find((d) => d.service_date === '2026-10-19')!.options[0] },
};
