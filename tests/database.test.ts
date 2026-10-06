// @vitest-environment node
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import october from '../src/data/october-2026.json';
import { createMonth } from '../src/utils/menuBuilder';
import type { MenuMonth } from '../src/types/domain';
const db = new PGlite();
const parent = '10000000-0000-4000-8000-000000000001',
  other = '10000000-0000-4000-8000-000000000002',
  admin = '10000000-0000-4000-8000-000000000003';
const child = '20000000-0000-4000-8000-000000000001',
  otherChild = '20000000-0000-4000-8000-000000000002';
const month = october as MenuMonth;
let novemberId = '';
const day = month.days.find((d) => d.service_date === '2026-10-06')!;
const asUser = async <T>(id: string, fn: (tx: Transaction) => Promise<T>) =>
  db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [id]);
    return fn(tx);
  });
const save = (
  tx: Transaction,
  cid = child,
  did = day.id,
  options = [day.options[0].id],
  breakfast = 'not_answered',
  edp = 'attending',
) =>
  tx.query('select public.save_daily_request($1,$2,$3,$4,$5::uuid[])', [
    cid,
    did,
    breakfast,
    edp,
    options,
  ]);
beforeAll(async () => {
  await db.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;",
  );
  await db.exec(readFileSync('supabase/migrations/20261006125922_school_plans.sql', 'utf8'));
  await db.exec(readFileSync('supabase/seed.sql', 'utf8'));
  for (const [id, role] of [
    [parent, 'parent'],
    [other, 'parent'],
    [admin, 'admin'],
  ]) {
    await db.query('insert into auth.users values($1)', [id]);
    await db.query('insert into public.profiles(id,role) values($1,$2)', [id, role]);
  }
  await db.query(
    "insert into public.children(id,parent_user_id,first_name) values($1,$2,'Ellie'),($3,$4,'Other child')",
    [child, parent, otherChild, other],
  );
  await db.query("update public.menu_months set status='published' where id=$1", [month.id]);
}, 30000);
afterAll(async () => {
  await db.close();
});
describe('real Postgres migrations, RLS, and transactional validation', () => {
  it('enables RLS on every public table', async () => {
    const r = await db.query<{ relrowsecurity: boolean }>(
      "select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'",
    );
    expect(r.rows).toHaveLength(9);
    expect(r.rows.every((r) => r.relrowsecurity)).toBe(true);
  });
  it('isolates children and profiles between families', async () => {
    const r = await asUser(parent, (tx) =>
      tx.query<{ id: string }>('select id from public.children'),
    );
    expect(r.rows.map((r) => r.id)).toEqual([child]);
    const profiles = await asUser(parent, (tx) =>
      tx.query<{ id: string }>('select id from public.profiles'),
    );
    expect(profiles.rows.map((r) => r.id)).toEqual([parent]);
  });
  it('denies profile role escalation and menu writes by parents', async () => {
    await expect(
      asUser(parent, (tx) =>
        tx.query("update public.profiles set role='admin' where id=$1", [parent]),
      ),
    ).rejects.toThrow(/permission denied/);
    await expect(
      asUser(parent, (tx) =>
        tx.query('select public.save_menu_month($1::jsonb)', [JSON.stringify(month)]),
      ),
    ).rejects.toThrow(/Administrator/);
  });
  it('saves lunch and EDP atomically and keeps optional breakfast unanswered', async () => {
    await asUser(parent, (tx) => save(tx));
    const r = await asUser(parent, (tx) =>
      tx.query<{ breakfast_status: string }>('select breakfast_status from public.daily_requests'),
    );
    expect(r.rows[0].breakfast_status).toBe('not_answered');
    const s = await asUser(parent, (tx) =>
      tx.query<{ option_name_snapshot: string }>(
        'select option_name_snapshot from public.meal_selections',
      ),
    );
    expect(s.rows[0].option_name_snapshot).toBe('Asian Chicken');
  });
  it('other families cannot read or change requests and selections', async () => {
    const r = await asUser(other, (tx) => tx.query('select * from public.daily_requests'));
    expect(r.rows).toHaveLength(0);
    const s = await asUser(other, (tx) => tx.query('select * from public.meal_selections'));
    expect(s.rows).toHaveLength(0);
    await expect(asUser(other, (tx) => save(tx))).rejects.toThrow(/Child not found/);
  });
  it('replaces a single-choice lunch and accepts intentional breakfast decline', async () => {
    await asUser(parent, (tx) =>
      save(tx, child, day.id, [day.options[1].id], 'declined', 'not_attending'),
    );
    const s = await asUser(parent, (tx) =>
      tx.query<{ menu_option_id: string }>('select menu_option_id from public.meal_selections'),
    );
    expect(s.rows.map((s) => s.menu_option_id)).toEqual([day.options[1].id]);
  });
  it('rejects multiple selections in a single category and rolls back', async () => {
    await expect(
      asUser(parent, (tx) => save(tx, child, day.id, [day.options[0].id, day.options[1].id])),
    ).rejects.toThrow(/single-choice/);
    const s = await asUser(parent, (tx) =>
      tx.query<{ menu_option_id: string }>('select menu_option_id from public.meal_selections'),
    );
    expect(s.rows.map((s) => s.menu_option_id)).toEqual([day.options[1].id]);
  });
  it('rejects options from another day and requests for another family', async () => {
    await expect(
      asUser(parent, (tx) => save(tx, child, day.id, [month.days[0].options[0].id])),
    ).rejects.toThrow(/selected date/);
    await expect(asUser(parent, (tx) => save(tx, otherChild))).rejects.toThrow(/Child not found/);
  });
  it('rejects no-school requests and unknown EDP attendance', async () => {
    await expect(
      asUser(parent, (tx) => save(tx, child, month.days.find((d) => d.no_school)!.id, [])),
    ).rejects.toThrow(/row-level security/);
    await db.query('update public.menu_days set edp_available=null where id=$1', [day.id]);
    await expect(asUser(parent, (tx) => save(tx))).rejects.toThrow(/not confirmed/);
    await db.query('update public.menu_days set edp_available=true where id=$1', [day.id]);
  });
  it('enforces single selection on direct Data API inserts too', async () => {
    await expect(
      asUser(parent, (tx) =>
        tx.query(
          "insert into public.meal_selections(user_id,child_id,menu_day_id,menu_option_id,meal_type,option_name_snapshot) values($1,$2,$3,$4,'lunch','fake')",
          [parent, child, day.id, day.options[0].id],
        ),
      ),
    ).rejects.toThrow(/single-choice/);
  });
  it('allows admins to create November and prevents premature publication', async () => {
    const next = createMonth(2026, 11, month);
    novemberId = next.id;
    await asUser(admin, (tx) =>
      tx.query('select public.save_menu_month($1::jsonb)', [JSON.stringify(next)]),
    );
    await expect(
      asUser(admin, (tx) =>
        tx.query('select public.save_menu_month($1::jsonb)', [
          JSON.stringify({ ...next, status: 'published' }),
        ]),
      ),
    ).rejects.toThrow(/configure meal options/);
    const seen = await asUser(parent, (tx) =>
      tx.query('select id from public.menu_months where id=$1', [next.id]),
    );
    expect(seen.rows).toHaveLength(0);
  });
  it('cannot forge an email draft to unlock an unpublished menu', async () => {
    await expect(
      asUser(other, (tx) =>
        tx.query(
          "insert into public.email_drafts(user_id,child_id,menu_month_id,recipient,subject,body,service_dates) values($1,$2,$3,'teacher@example.com','Forged','Forged history',array['2026-11-02'])",
          [other, otherChild, novemberId],
        ),
      ),
    ).rejects.toThrow(/row-level security/);
    const result = await asUser(other, (tx) =>
      tx.query('select id from public.menu_months where id=$1', [novemberId]),
    );
    expect(result.rows).toHaveLength(0);
  });
  it('retains a parent’s archived history without exposing it to unrelated parents', async () => {
    await db.query("update public.menu_months set status='archived' where id=$1", [month.id]);
    const owner = await asUser(parent, (tx) => tx.query('select id from public.menu_months'));
    expect(owner.rows).toHaveLength(1);
    const stranger = await asUser(other, (tx) => tx.query('select id from public.menu_months'));
    expect(stranger.rows).toHaveLength(0);
    await expect(asUser(parent, (tx) => save(tx))).rejects.toThrow(/row-level security/);
    await db.query("update public.menu_months set status='published' where id=$1", [month.id]);
  });
  it('draft snapshots are family-owned and immutable', async () => {
    await asUser(parent, (tx) =>
      tx.query(
        "insert into public.email_drafts(user_id,child_id,menu_month_id,recipient,subject,body,service_dates) values($1,$2,$3,'teacher@example.com','School plans','Original exact text',array['2026-10-06'])",
        [parent, child, month.id],
      ),
    );
    const rows = await asUser(other, (tx) => tx.query('select * from public.email_drafts'));
    expect(rows.rows).toHaveLength(0);
    await expect(
      asUser(parent, (tx) => tx.query("update public.email_drafts set body='Changed'")),
    ).rejects.toThrow(/permission denied/);
  });
});
