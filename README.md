# Cheverus School · School day plans

A mobile-first parent app for lunch, optional breakfast, and daily Extended Day attendance. Built with React, TypeScript, Vite, MUI, React Router, TanStack Query, React Hook Form, Zod, date-fns, and Supabase. Netlify serves the frontend; Supabase provides authentication and the private database.

## Run locally

Use Node 22.12 or newer.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite. Without cloud settings, choose **Try the October demo**. Demo family data lives only in localStorage, has an explicit banner, and uses an isolated sample workspace. It does not authenticate against Supabase or submit anything to school. Real family records are fetched from Supabase and are not persisted in the demo store.

```sh
npm run storybook
```

Storybook includes an interactive date → lunch → breakfast → EDP workflow, meal card states, all EDP states, breakfast configurations, month summaries, email previews, child forms, and admin day editing.

## Netlify hosting

The hosted app is [cheverus-school-menu.netlify.app](https://cheverus-school-menu.netlify.app), with [Storybook](https://cheverus-school-menu.netlify.app/storybook/?path=/story/day-parent-workflow--interactive) on the same site. The initial deploy is the isolated October demo; cloud sign-in and shared family records still require the backend setup below. The site belongs to the Girardjustin Netlify team and was deployed through the authenticated CLI. GitHub continuous deployment has not been connected yet.

To redeploy from this checkout:

```sh
npx netlify link --id 55f963a4-ef7e-4a68-91cf-67d694c555be
npm run build:netlify
npx netlify deploy --no-build --dir dist
```

After verifying that draft URL, publish with `npx netlify deploy --no-build --dir dist --prod`.

For continuous deployment and real sign-in:

1. Connect `girardjustin1/cheverus-school-menu` to the existing Cheverus site in Netlify. Use `main` for production after reviewing/merging the MVP PR; a branch deploy can preview `feature/mvp-school-meals-edp` first.
2. Build command: `npm run build:netlify`. Publish directory: `dist`. This builds the app at `/` and Storybook at `/storybook/`. `netlify.toml` sets Node 22, SPA route redirects, and permits Storybook's same-origin preview iframe.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from a dedicated Cheverus Supabase project. Use a **publishable** key, never a secret/service role key. `.env.example` documents local configuration; actual `.env` files are ignored.
4. Set the Supabase Auth Site URL to the Netlify production URL and allow `https://YOUR-SITE.netlify.app/auth/callback`. Add exact custom-domain/local-development URLs as needed. Magic links use the current origin; add branch preview URLs individually if testing Auth there.
5. Deploy the database migration and October seed below, sign in, grant the initial administrator role through trusted SQL, review October, and publish it in `/admin/menus`.

You can connect Netlify before Supabase. With no backend settings, the deployed app exposes only the clearly labeled device demo; real sign-in remains unavailable. To include the demo alongside a configured backend, set `VITE_ENABLE_DEMO=true`; it is otherwise disabled in a configured production build.

## Set up Supabase

Create/select a dedicated project; the implementation does not modify any unrelated existing project. Configure the email provider and use the default magic-link email template. The frontend uses `signInWithOtp` with persisted sessions and an implicit callback at `/auth/callback`.

```sh
npx supabase login
npx supabase link --project-ref YOUR_CHEVERUS_PROJECT_REF
npx supabase db push --include-seed
```

For a local full Supabase stack (requires Docker):

```sh
npx supabase start
npx supabase db reset --local
npx supabase migration list --local
```

Copy the local URL and publishable key into `.env.local` and restart Vite. No credentials are committed. The SQL migration creates all nine public tables, RLS policies, validation triggers, and the atomic `save_daily_request` and `save_menu_month` functions.

After the first administrator signs in, run this in the **trusted Supabase SQL editor**, replacing the email with that administrator’s actual account:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'YOUR_ADMIN_EMAIL');
```

A parent cannot grant themselves this role: browser permissions exclude the role column, and policies enforce ownership. Admins manage menus; they do not receive unrestricted access to other families’ children or requests.

October is seeded as **draft**. Verify it in the builder and use **Publish menu** after reviewing the source assumptions. EDP is configured from Justin’s confirmation: **2–6 pm every school day**. October 12 is no school. Future months support unknown EDP availability and cannot be published until their schedules and choices are complete. Food duplication is explicitly opt-in.

## Source and product decisions

- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [October menu review](docs/OCTOBER_MENU_REVIEW.md)
- [Deployment and verification](docs/QA.md)

The October source supplies one calendar entrée and two everyday sandwich alternatives. The conservative rule is one complete lunch, with included sides described instead of independently selected. Breakfast is an optional grab-and-go participation request because the source supplies general examples, not dated guaranteed item choices. Admins can configure item-specific breakfast for later menus.

The source screenshot/PDF remain in the local `references/` folder and are intentionally ignored along with unrelated design-reference downloads. The app’s structured transcription and school logo are committed.

## Saving, history, and email

Daily requests autosave with optimistic feedback, serialized writes, a retained failure state, and explicit retry. Pending decisions survive internal route changes and query refreshes; the browser warns before leaving with unsaved changes. Supabase saves request statuses and food selections in one transaction, enforcing ownership and category rules even on direct API writes. No school breakfast is always optional.

`/selections` shows the latest saved plans for each date. Meal names are snapshotted when selected. `/email` supports one date, selected dates, or the whole month. Open Email requires a valid recipient and completed required decisions; Copy Email remains available for draft text. Copy/open actions save immutable email snapshots. The app **cannot confirm email sending or delivery**; only the parent’s email client knows that status.

Menus can be archived or unpublished without losing the owning family’s history. Unsaved admin menu edits are retained in sessionStorage for the current tab; explicit discard removes them.

## Verify

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run build-storybook
npx playwright install chromium
npm run test:e2e
npm run format:check
```

Unit/component tests cover meal rules, optional breakfast, attendance, no-school handling, history snapshots, mailto encoding, magic-link feedback, and autosave recovery. Database tests run the actual migration and seed in PGlite (real PostgreSQL), with separate authenticated families and administrator identities; Docker/cloud credentials are not required. Playwright exercises the parent and admin flows on desktop and phone widths 375, 390, and 430 px. GitHub Actions runs the same checks.

The Netlify deployment and hosted app/Storybook browser checks passed. Live Supabase email delivery and cloud migration application remain unverified until a dedicated backend is connected.
