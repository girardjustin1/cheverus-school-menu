// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import type { User } from '@netlify/identity';
import type { Context } from '@netlify/functions';
import october from '../src/data/october-2026.json';
import type { MenuMonth } from '../src/types/domain';
const mocks = vi.hoisted(() => ({ user: null as User | null, query: vi.fn(), release: vi.fn() }));
vi.mock('@netlify/identity', async (original) => ({
  ...(await original<typeof import('@netlify/identity')>()),
  getUser: async () => mocks.user,
}));
vi.mock('@netlify/database', () => ({
  getDatabase: () => ({
    pool: {
      connect: async () => ({ query: mocks.query, release: mocks.release }),
      end: async () => {},
    },
  }),
}));
import handler from '../netlify/functions/school.mts';
const db = new PGlite();
const parent = '10000000-0000-4000-8000-000000000011',
  other = '10000000-0000-4000-8000-000000000012';
const child = '20000000-0000-4000-8000-000000000011';
const month = october as MenuMonth;
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const origin = 'https://school.example';
const asParent = (id = parent): User => ({
  id,
  email: `${id.slice(-2)}@example.com`,
  confirmedAt: '2026-10-06T12:00:00Z',
});
async function call(resource: string, body?: unknown, requestOrigin = origin) {
  return handler(
    new Request(
      `${origin}/api/school/${resource}`,
      body === undefined
        ? {}
        : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Origin: requestOrigin },
            body: JSON.stringify(body),
          },
    ),
    { params: { resource }, requestId: 'test' } as unknown as Context,
  );
}
const choices = () => ({
  child_id: child,
  menu_day_id: day.id,
  breakfast_status: 'not_answered',
  edp_status: 'attending',
  option_ids: [day.options[0].id],
});
beforeAll(async () => {
  await db.exec(
    readFileSync('netlify/database/migrations/20261006140000_school-plans/migration.sql', 'utf8'),
  );
  await db.exec(
    readFileSync('netlify/database/migrations/20261006140001_october-menu/migration.sql', 'utf8'),
  );
  await db.query("update public.menu_months set status='published' where id=$1", [month.id]);
  mocks.query.mockImplementation((sql: string, params?: unknown[]) => db.query(sql, params));
  mocks.user = asParent();
  await call('child', {
    id: child,
    first_name: 'Sample child',
    last_name: '',
    teacher_name: '',
    teacher_email: '',
    homeroom: '',
    active: true,
  });
}, 30000);
beforeEach(() => {
  mocks.user = asParent();
});
afterAll(() => db.close());
describe('Netlify API with real PostgreSQL family security', () => {
  it('rejects anonymous and unconfirmed accounts and prevents caching', async () => {
    mocks.user = null;
    const response = await call('family');
    expect(response.status).toBe(401);
    expect(response.headers.get('cache-control')).toContain('no-store');
    mocks.user = { id: parent, email: 'parent@example.com' };
    expect((await call('family')).status).toBe(401);
  });
  it('rejects cross-origin mutations before touching the database', async () => {
    expect(
      (await call('profile', { display_name: 'Changed' }, 'https://attacker.example')).status,
    ).toBe(403);
  });
  it('derives the child owner from verified identity and rejects supplied owners', async () => {
    const response = await call('child', {
      id: child,
      parent_user_id: other,
      first_name: 'Spoofed',
      last_name: '',
      teacher_name: '',
      teacher_email: '',
      homeroom: '',
      active: true,
    });
    expect(response.status).toBe(400);
    const family = await (await call('family')).json();
    expect(family.children[0].parent_user_id).toBe(parent);
  });
  it('saves a day transactionally and returns server-generated name snapshots', async () => {
    const response = await call('request', choices());
    expect(response.status).toBe(200);
    expect((await response.json()).option_names[day.options[0].id]).toBe('Asian Chicken');
  });
  it('isolates full family responses and denies cross-family request edits', async () => {
    mocks.user = asParent(other);
    const family = await (await call('family')).json();
    expect(family.children).toEqual([]);
    expect(family.requests).toEqual([]);
    expect(family.drafts).toEqual([]);
    expect((await call('request', choices())).status).toBe(403);
    expect(
      (
        await call('child', {
          id: child,
          first_name: 'Stolen',
          last_name: '',
          teacher_name: '',
          teacher_email: '',
          homeroom: '',
          active: true,
        })
      ).status,
    ).toBe(403);
  });
  it('rejects invalid single lunch choices and rolls back the prior request', async () => {
    expect(
      (await call('request', { ...choices(), option_ids: [day.options[0].id, day.options[1].id] }))
        .status,
    ).toBe(400);
    const family = await (await call('family')).json();
    expect(family.requests[0].option_ids).toEqual([day.options[0].id]);
  });
  it('does not honor roles in profile bodies or user-controlled Identity metadata', async () => {
    expect((await call('profile', { display_name: 'Parent', role: 'admin' })).status).toBe(400);
    mocks.user = { ...asParent(), userMetadata: { roles: ['admin'] } };
    expect((await call('menu', month)).status).toBe(403);
  });
  it('honors trusted Identity app roles and removes them when revoked', async () => {
    mocks.user = { ...asParent(), roles: ['admin'] };
    expect((await call('menu', month)).status).toBe(200);
    mocks.user = asParent();
    expect((await call('menu', month)).status).toBe(403);
    const family = await (await call('family')).json();
    expect(family.profile.role).toBe('parent');
  });
  it('keeps email snapshots private and immutable', async () => {
    const draft = {
      id: '30000000-0000-4000-8000-000000000011',
      child_id: child,
      menu_month_id: month.id,
      recipient: 'teacher@example.com',
      subject: 'School plans',
      body: 'Exact original text',
      service_dates: ['2026-10-06'],
      opened_at: null,
    };
    expect((await call('draft', draft)).status).toBe(200);
    expect((await call('draft', { ...draft, body: 'Changed' })).status).toBe(400);
    expect((await (await call('family')).json()).drafts[0].body).toBe('Exact original text');
    mocks.user = asParent(other);
    expect((await (await call('family')).json()).drafts).toEqual([]);
  });
  it('rejects email dates belonging to a different month', async () => {
    expect(
      (
        await call('draft', {
          id: '30000000-0000-4000-8000-000000000012',
          child_id: child,
          menu_month_id: month.id,
          recipient: '',
          subject: '',
          body: '',
          service_dates: ['2026-11-02'],
          opened_at: null,
        })
      ).status,
    ).toBe(400);
  });
  it('does not leak authentication state when a pooled connection is reused', async () => {
    mocks.user = asParent(other);
    await call('family');
    mocks.user = asParent();
    const family = await (await call('family')).json();
    expect(family.children[0].id).toBe(child);
    expect((await db.query<{ role: string }>('select current_user as role')).rows[0].role).not.toBe(
      'cheverus_app',
    );
  });
});
