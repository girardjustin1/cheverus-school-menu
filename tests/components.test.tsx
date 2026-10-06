import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import october from '../src/data/october-2026.json';
import { DailyPlan } from '../src/components/DailyPlan';
import { DateRail } from '../src/components/DateRail';
import { EdpAttendanceSelector } from '../src/features/edp/EdpAttendanceSelector';
import { MonthSelectionSummary } from '../src/features/selections/MonthSelectionSummary';
import { emptyRequest } from '../src/utils/plans';
import { theme } from '../src/theme/theme';
import type { MenuMonth } from '../src/types/domain';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
function Plan({ breakfastChoices = false }: { breakfastChoices?: boolean }) {
  const [request, setRequest] = useState(emptyRequest('child', day.id));
  const current = breakfastChoices
    ? {
        ...day,
        breakfast_mode: 'choices' as const,
        options: [
          ...day.options,
          {
            ...day.options[0],
            id: 'test-breakfast',
            menu_category_id: month.categories[1].id,
            name: 'Confirmed breakfast test fixture',
            meal_type: 'breakfast' as const,
          },
        ],
      }
    : day;
  return (
    <ThemeProvider theme={theme}>
      <DailyPlan
        day={current}
        categories={month.categories}
        childName="Ellie"
        request={request}
        onChange={setRequest}
      />
    </ThemeProvider>
  );
}
describe('parent controls', () => {
  it('whole-card lunch selection and optional breakfast complete the daily workflow', () => {
    render(<Plan />);
    fireEvent.click(screen.getByRole('button', { name: /Asian Chicken/ }));
    expect(screen.getByRole('button', { name: /Asian Chicken/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: /Jammie Sunbutter/ }));
    expect(screen.getByRole('button', { name: /Asian Chicken/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, attending' }));
    expect(screen.getByText('Day complete')).toBeVisible();
    expect(screen.getByRole('button', { name: 'No school breakfast' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    fireEvent.click(screen.getByRole('button', { name: 'No school breakfast' }));
    expect(screen.getByRole('button', { name: 'No school breakfast' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: 'No EDP' }));
    expect(screen.getByText('Ellie is not attending EDP.')).toBeVisible();
  });
  it('supports opting into school breakfast', () => {
    render(<Plan />);
    fireEvent.click(screen.getByRole('button', { name: 'Yes, breakfast' }));
    expect(screen.getByRole('button', { name: 'Yes, breakfast' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
  it('supports item-specific breakfast and deliberate decline', () => {
    render(<Plan breakfastChoices />);
    const choice = screen.getByRole('button', { name: /Confirmed breakfast test fixture/ });
    fireEvent.click(choice);
    expect(choice).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'No school breakfast' }));
    expect(choice).toHaveAttribute('aria-pressed', 'false');
  });
  it('distinguishes unavailable EDP and unconfirmed schedule', () => {
    const { rerender } = render(
      <EdpAttendanceSelector
        childName="Ellie"
        available={false}
        value="not_answered"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('EDP is not available on this date.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'No EDP' })).not.toBeInTheDocument();
    rerender(
      <EdpAttendanceSelector
        childName="Ellie"
        available={null}
        value="not_answered"
        onChange={() => {}}
      />,
    );
    expect(screen.getByText(/schedule awaiting confirmation/)).toBeVisible();
  });
  it('renders no-school without meal controls', () => {
    render(
      <DailyPlan
        day={month.days.find((d) => d.no_school)!}
        categories={month.categories}
        childName="Ellie"
        request={emptyRequest('child', 'none')}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('A day off from school.')).toBeVisible();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
  it('provides date and completion state to assistive technology', () => {
    render(<DateRail month={month} selectedId={day.id} requests={[]} onSelect={() => {}} />);
    expect(
      screen.getByRole('button', { name: /Tuesday, October 6.*Needs attention/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Monday, October 12.*No school/ })).toBeVisible();
  });
  it('month history shows previously saved lunch and unanswered EDP', () => {
    render(
      <MonthSelectionSummary
        month={{ ...month, days: [day] }}
        requests={[{ ...emptyRequest('child', day.id), option_ids: [day.options[0].id] }]}
        onEdit={() => {}}
      />,
    );
    expect(screen.getByText('Asian Chicken')).toBeVisible();
    expect(screen.getByText('Not answered')).toBeVisible();
    expect(screen.getByText('Needs attention')).toBeVisible();
  });
});
