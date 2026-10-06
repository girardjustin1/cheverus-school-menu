import fs from 'node:fs';
const m = JSON.parse(
  fs.readFileSync(new URL('../src/data/october-2026.json', import.meta.url), 'utf8'),
);
const quote = (v) =>
  v === null
    ? 'null'
    : typeof v === 'boolean' || typeof v === 'number'
      ? String(v)
      : `'${String(v).replaceAll("'", "''")}'`;
function insert(table, row) {
  const keys = Object.keys(row);
  return `insert into public.${table} (${keys.join(',')}) values (${keys.map((k) => quote(row[k])).join(',')}) on conflict (id) do nothing;`;
}
const { categories, days, ...month } = m;
const sql =
  [
    '-- Generated from the inspected October source. Keep production as draft until school review.',
    insert('menu_months', month),
    ...categories.map((c) => insert('menu_categories', c)),
    ...days.flatMap(({ options, ...d }) => [
      insert('menu_days', d),
      ...options.map((o) => insert('menu_options', { ...o, menu_month_id: m.id })),
    ]),
  ].join('\n') + '\n';
fs.writeFileSync(new URL('../supabase/seed.sql', import.meta.url), sql);
console.log(
  `Generated ${days.length} school dates and ${days.reduce((n, d) => n + d.options.length, 0)} lunch options. October remains draft.`,
);
