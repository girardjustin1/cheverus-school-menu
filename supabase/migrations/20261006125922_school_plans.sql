-- Family data is private; school menus are shared only after publication.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 100),
  email text not null default '',
  role text not null default 'parent' check (role in ('parent','admin')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.children (
  id uuid primary key default gen_random_uuid(), parent_user_id uuid not null references public.profiles(id) on delete cascade,
  first_name text not null check (length(trim(first_name)) between 1 and 80), last_name text not null default '' check (length(last_name) <= 80),
  teacher_name text not null default '' check (length(teacher_name) <= 100), teacher_email text not null default '' check (length(teacher_email) <= 254),
  homeroom text not null default '' check (length(homeroom) <= 80), active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,parent_user_id)
);
create table public.menu_months (
  id uuid primary key default gen_random_uuid(), school_year text not null,
  year integer not null check (year between 2020 and 2100), month integer not null check (month between 1 and 12),
  title text not null, description text not null default '', status text not null default 'draft' check (status in ('draft','published','archived')),
  source_reference text not null default '', created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(year,month)
);
create table public.menu_days (
  id uuid primary key default gen_random_uuid(), menu_month_id uuid not null references public.menu_months(id) on delete cascade,
  service_date date not null, weekday integer not null check (weekday between 1 and 7), title text not null default '', note text not null default '',
  no_school boolean not null default false, breakfast_available boolean not null default false,
  breakfast_mode text not null default 'opt_in' check (breakfast_mode in ('opt_in','choices')),
  lunch_available boolean not null default true, edp_available boolean, edp_note text not null default '', sort_order integer not null default 0,
  unique(menu_month_id,service_date), unique(id,menu_month_id),
  check (not no_school or (not breakfast_available and not lunch_available and edp_available is false))
);
create table public.menu_categories (
  id uuid primary key default gen_random_uuid(), menu_month_id uuid not null references public.menu_months(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast','lunch')), name text not null check(length(trim(name)) > 0), description text not null default '',
  selection_mode text not null default 'single' check (selection_mode in ('single','multiple','informational')), required boolean not null default false,
  sort_order integer not null default 0, unique(id,menu_month_id,meal_type), check (meal_type <> 'breakfast' or not required)
);
create table public.menu_options (
  id uuid primary key default gen_random_uuid(), menu_month_id uuid not null,
  menu_day_id uuid not null, menu_category_id uuid not null, meal_type text not null check (meal_type in ('breakfast','lunch')),
  name text not null check (length(trim(name)) > 0), description text not null default '', dietary_label text not null default '',
  unavailable boolean not null default false, sort_order integer not null default 0, illustration text,
  foreign key(menu_day_id,menu_month_id) references public.menu_days(id,menu_month_id) on delete cascade,
  foreign key(menu_category_id,menu_month_id,meal_type) references public.menu_categories(id,menu_month_id,meal_type) on delete cascade,
  unique(id,menu_day_id,meal_type)
);
create table public.daily_requests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null, menu_day_id uuid not null references public.menu_days(id),
  breakfast_status text not null default 'not_answered' check (breakfast_status in ('not_answered','declined','selected')),
  edp_status text not null default 'not_answered' check (edp_status in ('not_answered','attending','not_attending')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(child_id,user_id) references public.children(id,parent_user_id) on delete cascade,
  unique(child_id,menu_day_id), unique(child_id,menu_day_id,user_id)
);
create table public.meal_selections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null, child_id uuid not null, menu_day_id uuid not null,
  menu_option_id uuid not null, meal_type text not null check (meal_type in ('breakfast','lunch')),
  option_name_snapshot text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key(child_id,menu_day_id,user_id) references public.daily_requests(child_id,menu_day_id,user_id) on delete cascade,
  foreign key(menu_option_id,menu_day_id,meal_type) references public.menu_options(id,menu_day_id,meal_type), unique(child_id,menu_day_id,menu_option_id)
);
create table public.email_drafts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade, child_id uuid not null,
  menu_month_id uuid not null references public.menu_months(id), recipient text not null, subject text not null, body text not null,
  service_dates text[] not null, created_at timestamptz not null default now(), opened_at timestamptz,
  foreign key(child_id,user_id) references public.children(id,parent_user_id) on delete cascade
);
create index children_owner on public.children(parent_user_id);
create index requests_owner on public.daily_requests(user_id);
create index requests_day on public.daily_requests(menu_day_id);
create index selections_owner on public.meal_selections(user_id);
create index options_day on public.menu_options(menu_day_id);
create index options_category on public.menu_options(menu_category_id);
create index drafts_owner on public.email_drafts(user_id);
create index drafts_month on public.email_drafts(menu_month_id);

-- Read a trusted database role, never user-editable JWT user_metadata.
create function private.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

alter table public.profiles enable row level security;
alter table public.children enable row level security;
alter table public.menu_months enable row level security;
alter table public.menu_days enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_options enable row level security;
alter table public.daily_requests enable row level security;
alter table public.meal_selections enable row level security;
alter table public.email_drafts enable row level security;

create policy own_profile_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy own_profile_create on public.profiles for insert to authenticated with check (id = (select auth.uid()) and role = 'parent');
create policy own_profile_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_children on public.children for all to authenticated using (parent_user_id = (select auth.uid())) with check (parent_user_id = (select auth.uid()));
-- Avoid recursive policies between months and days: use a narrow private history lookup.
create function private.can_read_month(p_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.menu_months m where m.id = p_id and (
    m.status = 'published' or private.is_admin() or exists(select 1 from public.menu_days d join public.daily_requests r on r.menu_day_id=d.id where d.menu_month_id=m.id and r.user_id=auth.uid())
    or exists(select 1 from public.email_drafts e where e.menu_month_id=m.id and e.user_id=auth.uid())
  ));
$$;
revoke all on function private.can_read_month(uuid) from public;
grant execute on function private.can_read_month(uuid) to authenticated;
create policy menu_read on public.menu_months for select to authenticated using ((select private.can_read_month(id)));
create policy menu_admin on public.menu_months for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy day_read on public.menu_days for select to authenticated using ((select private.can_read_month(menu_month_id)));
create policy day_admin on public.menu_days for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy category_read on public.menu_categories for select to authenticated using ((select private.can_read_month(menu_month_id)));
create policy category_admin on public.menu_categories for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy option_read on public.menu_options for select to authenticated using ((select private.can_read_month(menu_month_id)));
create policy option_admin on public.menu_options for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy request_read on public.daily_requests for select to authenticated using (user_id = (select auth.uid()));
create policy request_create on public.daily_requests for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.menu_days d join public.menu_months m on m.id=d.menu_month_id where d.id=menu_day_id and m.status='published' and not d.no_school));
create policy request_update on public.daily_requests for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and exists(select 1 from public.menu_days d join public.menu_months m on m.id=d.menu_month_id where d.id=menu_day_id and m.status='published' and not d.no_school));
create policy selection_read on public.meal_selections for select to authenticated using (user_id = (select auth.uid()));
create policy selection_write on public.meal_selections for all to authenticated using (user_id = (select auth.uid()) and exists(select 1 from public.menu_days d join public.menu_months m on m.id=d.menu_month_id where d.id=menu_day_id and m.status='published' and not d.no_school)) with check (user_id = (select auth.uid()) and exists(select 1 from public.menu_days d join public.menu_months m on m.id=d.menu_month_id where d.id=menu_day_id and m.status='published' and not d.no_school));
create policy draft_read on public.email_drafts for select to authenticated using (user_id = (select auth.uid()));
create policy draft_create on public.email_drafts for insert to authenticated with check (user_id = (select auth.uid()));
-- Draft snapshots deliberately have no update/delete policy.
revoke all on all tables in schema public from anon;
grant select on all tables in schema public to authenticated;
grant insert(id,display_name,email) on public.profiles to authenticated;
grant update(display_name,updated_at) on public.profiles to authenticated;
grant insert,update,delete on public.children,public.menu_months,public.menu_days,public.menu_categories,public.menu_options,public.daily_requests,public.meal_selections to authenticated;
grant insert on public.email_drafts to authenticated;

create function private.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end; $$;
create trigger profile_touch before update on public.profiles for each row execute function private.touch_updated_at();
create trigger child_touch before update on public.children for each row execute function private.touch_updated_at();
create trigger month_touch before update on public.menu_months for each row execute function private.touch_updated_at();
create trigger request_touch before update on public.daily_requests for each row execute function private.touch_updated_at();

create function private.validate_day() returns trigger language plpgsql set search_path = '' as $$
declare m public.menu_months;
begin
  select * into m from public.menu_months where id=new.menu_month_id;
  if extract(year from new.service_date) <> m.year or extract(month from new.service_date) <> m.month or extract(isodow from new.service_date) <> new.weekday then raise exception 'School date must belong to its month and weekday'; end if;
  return new;
end; $$;
create trigger validate_day before insert or update on public.menu_days for each row execute function private.validate_day();

-- Deferred validation protects direct Data API writes as well as the transactional RPC.
create function private.validate_request() returns trigger language plpgsql set search_path = '' as $$
declare r public.daily_requests; d public.menu_days; cid uuid; did uuid;
begin
  cid=case when tg_op='DELETE' then old.child_id else new.child_id end;
  did=case when tg_op='DELETE' then old.menu_day_id else new.menu_day_id end;
  select * into r from public.daily_requests where child_id=cid and menu_day_id=did;
  if not found then return null; end if;
  select * into d from public.menu_days where id=did;
  if d.no_school then raise exception 'No requests on no-school dates'; end if;
  if d.edp_available is distinct from true and r.edp_status <> 'not_answered' then raise exception 'EDP is not confirmed available'; end if;
  if not d.breakfast_available and r.breakfast_status <> 'not_answered' then raise exception 'Breakfast is unavailable'; end if;
  if exists(select 1 from public.meal_selections s join public.menu_options o on o.id=s.menu_option_id join public.menu_categories c on c.id=o.menu_category_id where s.child_id=cid and s.menu_day_id=did and (o.unavailable or c.selection_mode='informational' or (s.meal_type='lunch' and not d.lunch_available) or (s.meal_type='breakfast' and (not d.breakfast_available or d.breakfast_mode <> 'choices' or r.breakfast_status <> 'selected')))) then raise exception 'Invalid or unavailable meal selection'; end if;
  if exists(select 1 from public.meal_selections s join public.menu_options o on o.id=s.menu_option_id join public.menu_categories c on c.id=o.menu_category_id where s.child_id=cid and s.menu_day_id=did and c.selection_mode='single' group by c.id having count(*)>1) then raise exception 'Choose only one option in a single-choice category'; end if;
  if r.breakfast_status='selected' and d.breakfast_mode='choices' and not exists(select 1 from public.meal_selections where child_id=cid and menu_day_id=did and meal_type='breakfast') then raise exception 'Choose a breakfast option or decline breakfast'; end if;
  return null;
end; $$;
create constraint trigger validate_request after insert or update on public.daily_requests deferrable initially deferred for each row execute function private.validate_request();
create constraint trigger validate_selections after insert or update or delete on public.meal_selections deferrable initially deferred for each row execute function private.validate_request();
create function private.snapshot_option() returns trigger language plpgsql set search_path = '' as $$ begin select name into new.option_name_snapshot from public.menu_options where id=new.menu_option_id; return new; end; $$;
create trigger snapshot_option before insert or update on public.meal_selections for each row execute function private.snapshot_option();

create function public.save_daily_request(p_child_id uuid,p_menu_day_id uuid,p_breakfast_status text,p_edp_status text,p_option_ids uuid[]) returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to save'; end if;
  -- Serialize concurrent writes to this child/date, including initial insert races.
  perform pg_advisory_xact_lock(hashtextextended(p_child_id::text || p_menu_day_id::text,0));
  if not exists(select 1 from public.children where id=p_child_id and parent_user_id=auth.uid() and active) then raise exception 'Child not found'; end if;
  if (select count(distinct o.id) from public.menu_options o where o.id=any(p_option_ids) and o.menu_day_id=p_menu_day_id) <> cardinality(p_option_ids) then raise exception 'Options must belong to the selected date'; end if;
  insert into public.daily_requests(user_id,child_id,menu_day_id,breakfast_status,edp_status) values(auth.uid(),p_child_id,p_menu_day_id,p_breakfast_status,p_edp_status)
  on conflict(child_id,menu_day_id) do update set breakfast_status=excluded.breakfast_status,edp_status=excluded.edp_status,updated_at=now();
  delete from public.meal_selections where child_id=p_child_id and menu_day_id=p_menu_day_id and user_id=auth.uid();
  insert into public.meal_selections(user_id,child_id,menu_day_id,menu_option_id,meal_type,option_name_snapshot)
  select auth.uid(),p_child_id,p_menu_day_id,id,meal_type,name from public.menu_options where id=any(p_option_ids);
end; $$;
revoke all on function public.save_daily_request(uuid,uuid,text,text,uuid[]) from public,anon;
grant execute on function public.save_daily_request(uuid,uuid,text,text,uuid[]) to authenticated;

create function public.save_menu_month(p_menu jsonb) returns void language plpgsql security invoker set search_path = '' as $$
declare mid uuid=(p_menu->>'id')::uuid; c jsonb; d jsonb; o jsonb;
begin
  if not private.is_admin() then raise exception 'Administrator access required'; end if;
  insert into public.menu_months(id,school_year,year,month,title,description,status,source_reference,created_by)
  values(mid,p_menu->>'school_year',(p_menu->>'year')::int,(p_menu->>'month')::int,p_menu->>'title',coalesce(p_menu->>'description',''),p_menu->>'status',coalesce(p_menu->>'source_reference',''),auth.uid())
  on conflict(id) do update set title=excluded.title,description=excluded.description,status=excluded.status,source_reference=excluded.source_reference;
  for c in select value from jsonb_array_elements(p_menu->'categories') loop
    if exists(select 1 from public.menu_categories where id=(c->>'id')::uuid and menu_month_id<>mid) then raise exception 'Category belongs to another month'; end if;
    insert into public.menu_categories(id,menu_month_id,meal_type,name,description,selection_mode,required,sort_order)
    values((c->>'id')::uuid,mid,c->>'meal_type',c->>'name',coalesce(c->>'description',''),c->>'selection_mode',(c->>'required')::boolean,(c->>'sort_order')::int)
    on conflict(id) do update set name=excluded.name,description=excluded.description,selection_mode=excluded.selection_mode,required=excluded.required;
  end loop;
  for d in select value from jsonb_array_elements(p_menu->'days') loop
    if exists(select 1 from public.menu_days where id=(d->>'id')::uuid and menu_month_id<>mid) then raise exception 'Date belongs to another month'; end if;
    insert into public.menu_days(id,menu_month_id,service_date,weekday,title,note,no_school,breakfast_available,breakfast_mode,lunch_available,edp_available,edp_note,sort_order)
    values((d->>'id')::uuid,mid,(d->>'service_date')::date,(d->>'weekday')::int,coalesce(d->>'title',''),coalesce(d->>'note',''),(d->>'no_school')::boolean,(d->>'breakfast_available')::boolean,d->>'breakfast_mode',(d->>'lunch_available')::boolean,(d->>'edp_available')::boolean,coalesce(d->>'edp_note',''),(d->>'sort_order')::int)
    on conflict(id) do update set title=excluded.title,note=excluded.note,no_school=excluded.no_school,breakfast_available=excluded.breakfast_available,breakfast_mode=excluded.breakfast_mode,lunch_available=excluded.lunch_available,edp_available=excluded.edp_available,edp_note=excluded.edp_note;
    for o in select value from jsonb_array_elements(d->'options') loop
      if exists(select 1 from public.menu_options where id=(o->>'id')::uuid and menu_day_id<>(d->>'id')::uuid) then raise exception 'Option belongs to another date'; end if;
      insert into public.menu_options(id,menu_month_id,menu_day_id,menu_category_id,meal_type,name,description,dietary_label,unavailable,sort_order,illustration)
      values((o->>'id')::uuid,mid,(d->>'id')::uuid,(o->>'menu_category_id')::uuid,o->>'meal_type',o->>'name',coalesce(o->>'description',''),coalesce(o->>'dietary_label',''),(o->>'unavailable')::boolean,(o->>'sort_order')::int,o->>'illustration')
      on conflict(id) do update set menu_category_id=excluded.menu_category_id,meal_type=excluded.meal_type,name=excluded.name,description=excluded.description,dietary_label=excluded.dietary_label,unavailable=excluded.unavailable,sort_order=excluded.sort_order;
    end loop;
  end loop;
  if p_menu->>'status'='published' then
    if exists(select 1 from public.menu_days d where d.menu_month_id=mid and not d.no_school and (d.edp_available is null or (d.lunch_available and not exists(select 1 from public.menu_options o where o.menu_day_id=d.id and o.meal_type='lunch' and not o.unavailable)) or (d.breakfast_available and d.breakfast_mode='choices' and not exists(select 1 from public.menu_options o where o.menu_day_id=d.id and o.meal_type='breakfast' and not o.unavailable)))) then raise exception 'Confirm service schedules and configure meal options before publishing'; end if;
    if exists(select 1 from public.menu_days d join public.menu_categories c on c.menu_month_id=d.menu_month_id where d.menu_month_id=mid and not d.no_school and d.lunch_available and c.meal_type='lunch' and c.required and c.selection_mode<>'informational' and not exists(select 1 from public.menu_options o where o.menu_day_id=d.id and o.menu_category_id=c.id and not o.unavailable)) then raise exception 'Every required lunch category needs options'; end if;
  end if;
end; $$;
revoke all on function public.save_menu_month(jsonb) from public,anon;
grant execute on function public.save_menu_month(jsonb) to authenticated;
-- Internal trigger functions are not API endpoints.
revoke all on function private.touch_updated_at(),private.validate_day(),private.validate_request(),private.snapshot_option() from public;
