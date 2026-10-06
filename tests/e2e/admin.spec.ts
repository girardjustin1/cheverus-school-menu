import { expect, test } from '@playwright/test';
test('admin duplicates structure, edits services and food, previews, and publishes', async ({
  page,
}) => {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Try the October demo' }).click();
  await page.goto('/admin/menus');
  await page.getByRole('button', { name: 'Create month' }).click();
  await page.getByLabel('Month and year').fill('2026-11');
  await page.getByLabel('Duplicate structure from').click();
  await page.getByRole('option', { name: 'October 2026' }).click();
  await expect(page.getByLabel('Also copy food choices (by weekday)')).not.toBeChecked();
  await page.getByLabel('Also copy food choices (by weekday)').check();
  await page.getByRole('button', { name: 'Generate weekdays' }).click();
  await expect(page.getByRole('heading', { name: 'Monday, November 2' })).toBeVisible();
  await page.getByLabel('Option name').first().fill('School-confirmed November lunch');
  await page.getByLabel('EDP availability').click();
  await page.getByRole('option', { name: 'Unavailable', exact: true }).click();
  await page.getByRole('button', { name: 'Preview as parent' }).click();
  await expect(page.getByRole('dialog')).toContainText('EDP is not available on this date.');
  await page.getByRole('button', { name: 'Close preview' }).click();
  await page.getByRole('button', { name: 'Publish menu', exact: true }).click();
  await page.getByLabel('I have reviewed this menu and its service schedules.').check();
  await page.getByRole('button', { name: 'Publish reviewed menu' }).click();
  await expect(page.getByText('November 2026 saved and published.')).toBeVisible();
  await page.goto('/menu?date=2026-11-02');
  await page.getByLabel('Month', { exact: true }).click();
  await page.getByRole('option', { name: 'November 2026' }).click();
  await expect(page.getByRole('button', { name: /School-confirmed November lunch/ })).toBeVisible();
  await expect(page.getByText('EDP is not available on this date.')).toBeVisible();
});
