# MVP verification — October 6, 2026

## Verified locally

| Check                                                  | Result                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| ESLint (`npm run lint`)                                | Pass, zero warnings                                                                                                            |
| TypeScript (`npm run typecheck`)                       | Pass                                                                                                                           |
| Vitest / RTL / PostgreSQL (`npm run test`)             | 62 passing tests across 7 files                                                                                                |
| PostgreSQL migrations and RLS                          | 14 passing database tests, executing the actual migration and seed in PGlite                                                   |
| Production Vite build (`npm run build`)                | Pass; larger admin/email/profile routes are loaded separately                                                                  |
| Storybook production build (`npm run build-storybook`) | Pass, 34 stories                                                                                                               |
| Playwright (`npm run test:e2e`)                        | 20 passing tests: 5 flows × desktop / 375 / 390 / 430 px                                                                       |
| Prettier (`npm run format:check`)                      | Pass                                                                                                                           |
| Interactive Storybook browser smoke check              | Lunch + EDP complete a day, no page errors                                                                                     |
| Visual inspection                                      | Desktop and 390 px phone screenshots reviewed; native rails, separate breakfast/EDP, readable choices, fixed mobile navigation |
| Diff review                                            | Checked source, migration/RLS, seed, configuration, and generated email behavior; `git diff --check` passes                    |

Additional backend checks: 11 Netlify Function API tests execute the actual PostgreSQL schema and transactions with trusted Identity fixtures. They verify anonymous/unconfirmed denial, no-store responses, CSRF checks, strict input, server-derived owners, family isolation, failed-save rollback, role spoofing/revocation, immutable email snapshots, date validation, and connection-state cleanup. `npm audit` reports zero vulnerabilities. The Netlify CLI also applied both migrations to its local database successfully.

The Storybook manager emits a bundle-size advisory for its own development/preview runtime. The application production build does not emit that advisory.

## Covered behavior

- Lunch selection, single-choice replacement, multiple/informational category rules, disabled/unavailable options, and changed menu/service handling.
- Breakfast participation and item selection, deliberate decline, and breakfast never blocking daily completion.
- EDP yes/no/unanswered, confirmed unavailable, awaiting confirmation, and no-school states.
- Autosave ordering, explicit retry, failed choices surviving stale query refreshes, and a failed date remaining visible when another date saves.
- Child isolation in the UI and RLS isolation between two authenticated families. Profile role escalation, cross-child/cross-date requests, invalid single-choice direct API writes, and forged history access to draft menus are rejected.
- November creation/structure duplication, explicit food copying, EDP availability editing, parent preview, and reviewed publication on every tested viewport.
- Parent date navigation, month history, valid recipient checks, one/several/month email scopes, clipboard text, mailto encoding, and immutable prepared-email snapshots.
- Netlify Identity email/password login, rejected login feedback, signup confirmation, generic password recovery responses, recovered password saving, and invitation acceptance with a mocked Identity client. Session tests verify that StrictMode redeems a callback once, confirmation leaves an existing demo workspace, and recovery requires the password-setting flow. Feedback appears only after the relevant Identity call succeeds.

## Source review still needed

See `OCTOBER_MENU_REVIEW.md` for the full transcription. Confirm the conservative one-lunch rule, everyday sandwich alternatives, generic breakfast participation, October 15 Pre-K substitution, and October 8 “Tater Tots” small print. EDP is already human-confirmed by Justin: 2–6 pm each school day. October 12 is explicitly no school.

October is a draft in the production seed. Admin publication requires reviewing the menu and service schedule. The isolated demo displays the transcription as a preview so it can be explored before cloud setup.

## Netlify deployment and backend migration

Justin requested Netlify for the complete stack. Supabase dependencies, client code, migrations, and configuration were removed. Netlify Identity handles authentication; the `/api/school/:resource` Function authenticates confirmed users and executes transactions through `@netlify/database`. It synchronizes only verified Identity application roles, sets a transaction-local user id, and assumes the non-login/non-superuser `cheverus_app` SQL role. Every application table retains RLS; privileged database credentials are never bundled into the browser.

The existing Netlify site hosts [the app](https://cheverus-school-menu.netlify.app) and [Storybook](https://cheverus-school-menu.netlify.app/storybook/?path=/story/day-parent-workflow--interactive). The replacement was deployed first to [the Netlify backend preview](https://netlify-backend--cheverus-school-menu.netlify.app). Both SQL migrations applied to the isolated cloud preview branch and the production database; Netlify reports no pending migrations on either. A credential-protected SDK query verified 22 weekday records, 64 lunch options, RLS on all nine application tables, and the restricted SQL role. Production October remains a draft pending source review.

Hosted Chromium checks verify the new sign-in UI, demo daily completion, saved-device choices after reload, and interactive Storybook without page errors. Direct requests to private Function endpoints without an authenticated user return 401 and `Cache-Control: private, no-store`. These checks do not claim authenticated cloud saves. The production deploy uses the full Netlify build/deploy flow, which applies database migrations; a static `--no-build` upload alone does not initialize an absent cloud database. Netlify CLI linkage is ignored by Git. GitHub continuous deployment remains a separate setup step.

## Setup / not claimed as verified

**Netlify Identity activation is still required in the site's dashboard.** The connected CLI can deploy and manage Database; the available connector does not expose Identity activation, and the dashboard browser session is at the login screen. A setup request was sent to Justin with the exact Identity page. Live sign-up confirmation/recovery mail and authenticated Function saves remain unverified until that service is enabled and an account is confirmed. Assign the first administrator through Identity's server-managed application roles, review October, and publish the menu before real parent use. No external database project is required.

Opening a mailto draft cannot confirm sending or delivery. History labels record prepared/copied drafts and requests to open the email app. The proposed 10/20-second human usability targets were not measured with actual parents; the automated flows verify the required interactions and phone layouts.
