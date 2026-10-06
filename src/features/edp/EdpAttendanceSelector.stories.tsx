import type { Meta, StoryObj } from '@storybook/react-vite';
import { EdpAttendanceSelector } from './EdpAttendanceSelector';
const meta = {
  title: 'EDP/EdpAttendanceSelector',
  component: EdpAttendanceSelector,
  args: {
    childName: 'Ellie',
    available: true,
    value: 'not_answered',
    note: '2–6 pm',
    onChange: () => {},
  },
} satisfies Meta<typeof EdpAttendanceSelector>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Unanswered: Story = {};
export const Attending: Story = { args: { value: 'attending' } };
export const NotAttending: Story = { args: { value: 'not_attending' } };
export const Unavailable: Story = { args: { available: false } };
export const AwaitingConfirmation: Story = { args: { available: null } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
