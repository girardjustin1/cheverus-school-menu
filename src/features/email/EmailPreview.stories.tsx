import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmailPreview } from './EmailPreview';
const meta = {
  title: 'Email/EmailPreview',
  component: EmailPreview,
  args: {
    recipient: 'teacher@example.com',
    subject: 'Ellie — October 2026 school plans',
    body: 'Hello,\n\nTuesday, October 6\nLunch: Asian Chicken\nBreakfast: Not requested\nEDP: Attending EDP\n\nThank you,\nJustin',
  },
} satisfies Meta<typeof EmailPreview>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = {};
export const MissingRecipient: Story = { args: { recipient: '' } };
