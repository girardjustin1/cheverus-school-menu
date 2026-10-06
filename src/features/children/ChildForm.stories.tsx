import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChildForm } from './ChildForm';
const meta = {
  title: 'Forms/ChildForm',
  component: ChildForm,
  args: { onSubmit: async () => {} },
} satisfies Meta<typeof ChildForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const NewChild: Story = {};
export const EditChild: Story = {
  args: {
    child: {
      id: 'sample',
      parent_user_id: 'sample',
      first_name: 'Ellie',
      last_name: '',
      teacher_name: '',
      teacher_email: '',
      homeroom: '',
      active: true,
    },
  },
};
