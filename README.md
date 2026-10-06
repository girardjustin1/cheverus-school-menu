# Cheverus School · School day plans

A mobile-first parent app for lunch, optional breakfast, and daily Extended Day attendance. React, TypeScript, Vite, MUI, React Router, TanStack Query, React Hook Form, Zod, and date-fns power the frontend. **Netlify hosts the app and Storybook, authenticates parents with Identity, runs the API in Functions, and stores private records in Netlify Database (Postgres).**

- [Hosted app](https://cheverus-school-menu.netlify.app)
- [Storybook — interactive parent workflow](https://cheverus-school-menu.netlify.app/storybook/?path=/story/day-parent-workflow--interactive)
- [Netlify project](https://app.netlify.com/projects/cheverus-school-menu)

## GUI prototype first

Run `npm run storybook`, then open [the local phone prototype](http://localhost:6006/?path=/story/prototype-cheverus-app--phone) or [the full parent workflow](http://localhost:6006/?path=/story/prototype-cheverus-app--parent-workflow). The **Prototype → Cheverus app** section includes monthly review, email preview, family setup, the first-child empty state, school administration, simulated sign-in, no school, and a save failure with retry. The parent navigation connects the screens, so lunch, breakfast, EDP, review, and email can be explored as one flow.

Storybook uses its own in-memory family/menu and authentication mocks. No account or cloud setup is needed. Changes reset when the story reloads or **Reset prototype** is pressed. All food comes from the October transcription; family/teacher details and saved plans are labeled samples. **Open Email** previews that action in a dialog; **Copy Email** copies preview text. For the sign-in story, any valid sample email and nonempty sample password enter the prototype; signup/recovery only show simulated feedback.

The Storybook Vite configuration substitutes these mocks only in Storybook. The normal app build keeps its existing repositories and authentication. Continue GUI review here before further backend or deployment work.

## Run locally

Use Node 22.12 or newer.

```sh
npm ci
npm run dev
npm run storybook
```

Choose **Try the October demo** to explore locally. Sample family data stays in a separate localStorage workspace; it does not submit anything to school or access real family records. Authenticated family records stay in query memory and Netlify Database. Identity manages the persisted sign-in session.

For local Functions and database work:

```sh
npx netlify link --id 55f963a4-ef7e-4a68-91cf-67d694c555be
npx netlify database migrations apply
npx netlify dev
```

Netlify Identity currently requires a hosted HTTPS site for testing. Local database/security tests do not require cloud credentials. Browser tests use port 5175 and start their own server to avoid using an unrelated local app.

## Netlify setup and deployment

1. In [Cheverus Identity](https://app.netlify.com/projects/cheverus-school-menu/identity), select **Enable Identity**. Keep email confirmation enabled. Open registration allows parents to create accounts; invite-only registration is also supported. The app follows the site's registration setting.
2. Parents use email and password, confirm their email, and remain signed in on their device. Confirmation, invitation, and password recovery callbacks are processed on page load. Recovery/invitation flows ask the parent to set a password before entering their plans. Netlify handles authentication emails; the application never sends meal-plan emails itself.
3. The dedicated Cheverus Netlify Database is provisioned, with migrations applied to production and the isolated preview branch. It is accessed through `@netlify/database`. Migrations live in `netlify/database/migrations/<timestamp>_<slug>/migration.sql`. The schema and October seed are separate versioned migrations. Applied migration files are immutable; use the admin builder or a new migration for future changes rather than rewriting the original seed. Database URLs and credentials are managed server-side by Netlify and never exposed as Vite variables.
4. The build command is `npm run build:netlify`, publishing `dist`. It builds the app at `/` and Storybook at `/storybook/`. Netlify routes the `/api/school/:resource` endpoint to a Function before the SPA fallback. Same-origin framing lets Storybook render its preview while excluding other origins.
5. The optional `VITE_ENABLE_DEMO=true` setting includes a labeled sample workspace. Set it to `false` to hide the demo after school rollout. `.env.example` contains no database credentials.

Deploy a preview from this checkout:

```sh
npx netlify deploy
```

After verifying it, deploy to the stable URL:

```sh
npx netlify deploy --prod
```

Use the full deploy/build flow so Netlify can detect Database, provision its branch, and apply the migrations. A raw static `--no-build` upload alone does not verify database provisioning. The site belongs to the Girardjustin team. CLI deploys do not connect GitHub continuous deployment; connect `girardjustin1/cheverus-school-menu` to the existing site separately, using `main` after reviewing/merging the MVP PR.

## Administrator and October review

After the initial administrator creates and confirms an account, assign **admin** in that Identity user's server-controlled application roles through the Netlify dashboard. The API synchronizes that trusted role to the profile in each database transaction; user-editable metadata and submitted profile fields cannot grant access. Role revocation takes effect on subsequent API calls.

Use `/admin/menus` to review October and publish it. The production seed starts as **draft**. EDP is configured from Justin's confirmation: **2–6 pm every school day**; October 12 is no school. Future menus support unknown EDP availability and cannot be published until the schedule and options are complete. Copying food to another month is explicitly opt-in.

- [October menu transcription and review](docs/OCTOBER_MENU_REVIEW.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Verification record](docs/QA.md)

The source provides one calendar entrée plus two everyday sandwich alternatives. The conservative rule is one complete lunch, with included sides described rather than separately selected. Breakfast is an optional grab-and-go participation request because the source provides general examples rather than dated guaranteed choices. Admins can configure item-specific breakfast for later menus.

## Private data and saving

Every API call requires a confirmed Netlify Identity account. Mutations require same-origin JSON requests and validated input. Ownership comes from the verified user, never a browser-supplied parent id. Each database transaction assumes a restricted, non-login SQL role and sets the verified user id locally; RLS isolates all nine tables, including menu-history access. Connection state resets at commit/rollback. The database connection credentials are never available in the browser.

Daily requests and meal selections save atomically. Database constraints enforce option/date membership, ownership, single-selection rules, and service availability. The frontend retains optimistic choices and visible failures, serializes autosaves, and supports explicit retry. Meal names are snapshotted server-side; email snapshots are immutable. Archiving or unpublishing a menu preserves the owning family's history without exposing it to another parent. Admin roles permit menu management rather than unrestricted access to families.

The app collects only parent name/email and basic child/teacher details. It does not collect birthdays, medical records, allergies, student identifiers, addresses, or payment information.

## Email

`/email` supports one day, selected days, or the whole month. **Open Email** requires a valid recipient and completed required choices; **Copy Email** also supports draft text. Copy/open actions preserve exact email snapshots. An encoded `mailto:` opens the parent's ordinary email app. The application cannot confirm sending or delivery.

## Verify

```sh
npm run lint
npm run typecheck
npm run test
npm run build:netlify
npx playwright install chromium
npm run test:e2e
npm run format:check
npm audit
```

Tests execute the actual Netlify SQL migrations and seed in PGlite (PostgreSQL), plus the Function handler against PostgreSQL with trusted Identity fixtures. They cover family isolation, role escalation, cross-origin mutations, transaction rollback, menu rules, email snapshots, auth feedback, and autosave recovery. Playwright covers parent/admin flows on desktop and 375/390/430 px phone layouts. GitHub Actions runs the same checks.

Live Identity confirmation/recovery emails and authenticated cloud saves require Identity activation and separate hosted verification. They are distinguished from the local security and component tests in `docs/QA.md`.
