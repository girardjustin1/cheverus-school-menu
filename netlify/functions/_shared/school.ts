import type { PoolClient } from 'pg';
import { z } from 'zod';
import type {
  Child,
  DailyRequest,
  EmailDraft,
  Family,
  MenuMonth,
  Profile,
} from '../../../src/types/domain';

const uuid = z.string().uuid();
const text = (max: number) => z.string().trim().max(max);
const childSchema = z
  .object({
    id: uuid,
    first_name: text(80).min(1),
    last_name: text(80),
    teacher_name: text(100),
    teacher_email: z.union([z.literal(''), z.string().email().max(254)]),
    homeroom: text(80),
    active: z.boolean(),
  })
  .strict();
const requestSchema = z
  .object({
    child_id: uuid,
    menu_day_id: uuid,
    breakfast_status: z.enum(['not_answered', 'declined', 'selected']),
    edp_status: z.enum(['not_answered', 'attending', 'not_attending']),
    option_ids: z.array(uuid).max(100),
  })
  .strict();
const draftSchema = z
  .object({
    id: uuid,
    child_id: uuid,
    menu_month_id: uuid,
    recipient: z.string().max(254),
    subject: z.string().max(500),
    body: z.string().max(50000),
    service_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(31),
    opened_at: z.string().datetime().nullable(),
  })
  .strict();
const categorySchema = z
  .object({
    id: uuid,
    menu_month_id: uuid,
    meal_type: z.enum(['breakfast', 'lunch']),
    name: text(200).min(1),
    description: text(2000),
    selection_mode: z.enum(['single', 'multiple', 'informational']),
    required: z.boolean(),
    sort_order: z.number().int().min(0).max(1000),
  })
  .strict();
const optionSchema = z
  .object({
    id: uuid,
    menu_day_id: uuid,
    menu_category_id: uuid,
    meal_type: z.enum(['breakfast', 'lunch']),
    name: text(200).min(1),
    description: text(2000),
    dietary_label: text(100),
    unavailable: z.boolean(),
    sort_order: z.number().int().min(0).max(1000),
    illustration: z.enum(['hot', 'sunbutter', 'cheese']).optional(),
  })
  .strict();
const daySchema = z
  .object({
    id: uuid,
    menu_month_id: uuid,
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    weekday: z.number().int().min(1).max(7),
    title: text(200),
    note: text(2000),
    no_school: z.boolean(),
    breakfast_available: z.boolean(),
    breakfast_mode: z.enum(['opt_in', 'choices']),
    lunch_available: z.boolean(),
    edp_available: z.boolean().nullable(),
    edp_note: text(2000),
    sort_order: z.number().int().min(0).max(1000),
    options: z.array(optionSchema).max(100),
  })
  .strict();
const menuSchema = z
  .object({
    id: uuid,
    school_year: text(20).min(1),
    year: z.number().int().min(2020).max(2100),
    month: z.number().int().min(1).max(12),
    title: text(200).min(1),
    description: text(5000),
    status: z.enum(['draft', 'published', 'archived']),
    source_reference: text(1000),
    categories: z.array(categorySchema).max(30),
    days: z.array(daySchema).max(31),
  })
  .strict()
  .superRefine((menu, ctx) => {
    const ids = new Set<string>();
    for (const record of [
      menu,
      ...menu.categories,
      ...menu.days,
      ...menu.days.flatMap((d) => d.options),
    ]) {
      if (ids.has(record.id))
        ctx.addIssue({ code: 'custom', message: 'Menu records need unique identifiers.' });
      ids.add(record.id);
    }
    if (
      menu.categories.some((c) => c.menu_month_id !== menu.id) ||
      menu.days.some(
        (d) =>
          d.menu_month_id !== menu.id ||
          d.options.some(
            (o) =>
              o.menu_day_id !== d.id ||
              !menu.categories.some(
                (c) => c.id === o.menu_category_id && c.meal_type === o.meal_type,
              ),
          ),
      )
    ) {
      ctx.addIssue({ code: 'custom', message: 'Menu records must belong to this month and date.' });
    }
  });

export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

async function loadRequests(db: PoolClient): Promise<DailyRequest[]> {
  const { rows } =
    await db.query(`select r.child_id,r.menu_day_id,r.breakfast_status,r.edp_status,r.updated_at,
    coalesce(jsonb_agg(s.menu_option_id) filter(where s.id is not null),'[]'::jsonb) as option_ids,
    coalesce(jsonb_object_agg(s.menu_option_id,s.option_name_snapshot) filter(where s.id is not null),'{}'::jsonb) as option_names
    from public.daily_requests r left join public.meal_selections s on s.child_id=r.child_id and s.menu_day_id=r.menu_day_id
    group by r.id order by r.menu_day_id`);
  return rows;
}
async function loadMenus(db: PoolClient): Promise<MenuMonth[]> {
  const months = (
    await db.query(
      'select id,school_year,year,month,title,description,status,source_reference from public.menu_months order by year,month',
    )
  ).rows;
  const categories = (
    await db.query(
      'select id,menu_month_id,meal_type,name,description,selection_mode,required,sort_order from public.menu_categories order by sort_order',
    )
  ).rows;
  const days = (
    await db.query(
      "select id,menu_month_id,to_char(service_date,'YYYY-MM-DD') as service_date,weekday,title,note,no_school,breakfast_available,breakfast_mode,lunch_available,edp_available,edp_note,sort_order from public.menu_days order by service_date",
    )
  ).rows;
  const options = (
    await db.query(
      'select id,menu_day_id,menu_category_id,meal_type,name,description,dietary_label,unavailable,sort_order,illustration from public.menu_options order by sort_order',
    )
  ).rows.map(({ illustration, ...o }) => ({ ...o, ...(illustration ? { illustration } : {}) }));
  return months.map((m) => ({
    ...m,
    categories: categories.filter((c) => c.menu_month_id === m.id),
    days: days
      .filter((d) => d.menu_month_id === m.id)
      .map((d) => ({ ...d, options: options.filter((o) => o.menu_day_id === d.id) })),
  })) as MenuMonth[];
}

// The connection already carries the verified user and the restricted SQL role.
export async function schoolOperation(
  db: PoolClient,
  userId: string,
  resource: string,
  method: string,
  body?: unknown,
): Promise<unknown> {
  if (method === 'GET' && resource === 'family') {
    const profile = (
      await db.query('select id,display_name,email,role from public.profiles where id=$1', [userId])
    ).rows[0] as Profile;
    const children = (
      await db.query(
        'select id,parent_user_id,first_name,last_name,teacher_name,teacher_email,homeroom,active from public.children where active order by created_at',
      )
    ).rows as Child[];
    const drafts = (
      await db.query(
        'select id,child_id,menu_month_id,recipient,subject,body,service_dates,created_at,opened_at from public.email_drafts order by created_at desc',
      )
    ).rows as EmailDraft[];
    return { profile, children, requests: await loadRequests(db), drafts } satisfies Family;
  }
  if (method === 'GET' && resource === 'menus') return loadMenus(db);
  if (method !== 'POST') throw new ApiError('Method not allowed.', 405);
  switch (resource) {
    case 'request': {
      const r = requestSchema.parse(body);
      await db.query('select public.save_daily_request($1,$2,$3,$4,$5::uuid[])', [
        r.child_id,
        r.menu_day_id,
        r.breakfast_status,
        r.edp_status,
        r.option_ids,
      ]);
      return (await loadRequests(db)).find(
        (saved) => saved.child_id === r.child_id && saved.menu_day_id === r.menu_day_id,
      );
    }
    case 'child': {
      const c = childSchema.parse(body);
      await db.query(
        `insert into public.children(id,parent_user_id,first_name,last_name,teacher_name,teacher_email,homeroom,active) values($1,$2,$3,$4,$5,$6,$7,$8)
        on conflict(id) do update set first_name=excluded.first_name,last_name=excluded.last_name,teacher_name=excluded.teacher_name,teacher_email=excluded.teacher_email,homeroom=excluded.homeroom,active=excluded.active`,
        [
          c.id,
          userId,
          c.first_name,
          c.last_name,
          c.teacher_name,
          c.teacher_email,
          c.homeroom,
          c.active,
        ],
      );
      return { ok: true };
    }
    case 'profile': {
      const p = z
        .object({ display_name: text(100).min(1) })
        .strict()
        .parse(body);
      await db.query('update public.profiles set display_name=$1 where id=$2', [
        p.display_name,
        userId,
      ]);
      return { ok: true };
    }
    case 'draft': {
      const d = draftSchema.parse(body);
      const dates = (
        await db.query(
          "select to_char(service_date,'YYYY-MM-DD') as date from public.menu_days where menu_month_id=$1",
          [d.menu_month_id],
        )
      ).rows.map((r) => r.date);
      if (!dates.length || d.service_dates.some((date) => !dates.includes(date)))
        throw new ApiError('Email dates must belong to an accessible menu.');
      await db.query(
        'insert into public.email_drafts(id,user_id,child_id,menu_month_id,recipient,subject,body,service_dates,opened_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [
          d.id,
          userId,
          d.child_id,
          d.menu_month_id,
          d.recipient,
          d.subject,
          d.body,
          d.service_dates,
          d.opened_at,
        ],
      );
      return { ok: true };
    }
    case 'menu': {
      const m = menuSchema.parse(body);
      await db.query('select public.save_menu_month($1::jsonb)', [JSON.stringify(m)]);
      return { ok: true };
    }
    default:
      throw new ApiError('Endpoint not found.', 404);
  }
}
