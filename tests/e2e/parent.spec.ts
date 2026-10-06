import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Try the October demo' }).click();
  await expect(page.getByRole('heading', { name: 'School days, sorted.' })).toBeVisible();
});

test('parent login, child, two dates, review, email, and saved history', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('link', { name: 'Family profile' }).click();
  await page.getByLabel('Teacher name (optional)').fill('Mrs. Smith');
  await page.getByLabel('Teacher email (optional)').fill('teacher@example.com');
  await page.getByRole('button', { name: 'Save child details' }).click();
  await expect(page.getByText('Child details saved.')).toBeVisible();
  await page.goto('/menu?date=2026-10-06');
  await page.getByRole('button', { name: /Asian Chicken/ }).click();
  await page.getByRole('button', { name: 'No school breakfast' }).click();
  await page.getByRole('button', { name: 'Yes, attending' }).click();
  await expect(page.getByText('Day complete')).toBeVisible();
  await expect(page.getByText('Saved on device')).toBeVisible();
  await page.getByRole('button', { name: 'Next school day' }).click();
  await page.getByRole('button', { name: /Macaroni & Cheese/ }).click();
  await page.getByRole('button', { name: 'Yes, breakfast' }).click();
  await page.getByRole('button', { name: 'No EDP' }).click();
  await expect(page.getByText('Day complete')).toBeVisible();
  await page.goto('/selections');
  const oct6 = page.getByRole('button', { name: 'Edit Tuesday, October 6' });
  await expect(oct6).toContainText('Asian Chicken');
  await expect(oct6).toContainText('Attending EDP');
  await page.getByRole('link', { name: 'Generate email' }).click();
  await page.getByLabel('Include').click();
  await page.getByRole('option', { name: 'Choose dates' }).click();
  await expect(page.getByRole('button', { name: 'Open Email' })).toBeEnabled();
  await expect(page.locator('pre').first()).toContainText('Lunch: Asian Chicken');
  await expect(page.locator('pre').first()).toContainText(
    'Breakfast: Grab-and-go breakfast requested',
  );
  await expect(page.locator('pre').first()).toContainText('EDP: Not attending');
  await page.getByRole('button', { name: 'Copy Email' }).click();
  await expect(
    page.getByText('Email copied. A snapshot is saved below for your records.'),
  ).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'teacher@example.com',
  );
  await page.reload();
  await expect(page.getByText(/2 dates · Copied draft/)).toBeVisible();
  await page.goto('/menu?date=2026-10-06');
  await expect(page.getByRole('button', { name: /Asian Chicken/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Yes, attending' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('breakfast optional, single lunch replacement, no school, and no overflow', async ({
  page,
}) => {
  await page.goto('/menu?date=2026-10-06');
  await page.getByRole('button', { name: /Asian Chicken/ }).click();
  await expect(page.getByText('Still needed: EDP attendance')).toBeVisible();
  await page.getByRole('button', { name: /American Cheese on Wheat Bread/ }).click();
  await expect(page.getByRole('button', { name: /Asian Chicken/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await page.getByRole('button', { name: 'No EDP' }).click();
  await expect(page.getByText('Day complete')).toBeVisible();
  await expect(page.getByRole('button', { name: 'No school breakfast' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  const widths = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.viewport);
  await page.getByRole('button', { name: /Monday, October 12.*No school/ }).click();
  await expect(page.getByRole('heading', { name: 'A day off from school.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Lunch', exact: true })).toHaveCount(0);
});

test('a second child has independent plans', async ({ page }) => {
  await page.goto('/menu?date=2026-10-14');
  await page.getByRole('button', { name: /Spaghetti and Meatballs/ }).click();
  await page.getByRole('button', { name: 'No EDP' }).click();
  await page.getByRole('link', { name: 'Family profile' }).click();
  await page.getByRole('button', { name: 'Add another child' }).click();
  await page.getByLabel('Child’s first name').last().fill('Sample sibling');
  await page.getByRole('button', { name: 'Add child', exact: true }).click();
  await expect(page.getByText('Child details saved.')).toBeVisible();
  await page.goto('/menu?date=2026-10-14');
  await page.getByLabel('Ordering for').click();
  await page.getByRole('option', { name: 'Sample sibling' }).click();
  await expect(page.getByRole('button', { name: /Spaghetti and Meatballs/ })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  await expect(page.getByRole('button', { name: 'No EDP' })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
});

test('email requires a real recipient and complete selected days', async ({ page }) => {
  await page.goto('/email');
  await expect(page.getByRole('button', { name: 'Open Email' })).toBeDisabled();
  await page.getByLabel('Recipient email').fill('teacher@example.com');
  await expect(page.getByRole('button', { name: 'Open Email' })).toBeDisabled();
  await expect(page.getByText(/21 dates need lunch or EDP decisions/)).toBeVisible();
});
