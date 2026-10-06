# MVP verification — October 6, 2026

## Verified locally

| Check                                                  | Result                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| ESLint (`npm run lint`)                                | Pass, zero warnings                                                                                                            |
| TypeScript (`npm run typecheck`)                       | Pass                                                                                                                           |
| Vitest / RTL / PostgreSQL (`npm run test`)             | 45 passing tests across 5 files                                                                                                |
| PostgreSQL migrations and RLS                          | 14 passing database tests, executing the actual migration and seed in PGlite                                                   |
| Production Vite build (`npm run build`)                | Pass; larger admin/email/profile routes are loaded separately                                                                  |
| Storybook production build (`npm run build-storybook`) | Pass, 34 stories                                                                                                               |
| Playwright (`npm run test:e2e`)                        | 20 passing tests: 5 flows × desktop / 375 / 390 / 430 px                                                                       |
| Prettier (`npm run format:check`)                      | Pass                                                                                                                           |
| Interactive Storybook browser smoke check              | Lunch + EDP complete a day, no page errors                                                                                     |
| Visual inspection                                      | Desktop and 390 px phone screenshots reviewed; native rails, separate breakfast/EDP, readable choices, fixed mobile navigation |
| Diff review                                            | Checked source, migration/RLS, seed, configuration, and generated email behavior; `git diff --check` passes                    |

The Storybook manager emits a bundle-size advisory for its own development/preview runtime. The application production build does not emit that advisory.

## Covered behavior

- Lunch selection, single-choice replacement, multiple/informational category rules, disabled/unavailable options, and changed menu/service handling.
- Breakfast participation and item selection, deliberate decline, and breakfast never blocking daily completion.
- EDP yes/no/unanswered, confirmed unavailable, awaiting confirmation, and no-school states.
- Autosave ordering, explicit retry, failed choices surviving stale query refreshes, and a failed date remaining visible when another date saves.
- Child isolation in the UI and RLS isolation between two authenticated families. Profile role escalation, cross-child/cross-date requests, invalid single-choice direct API writes, and forged history access to draft menus are rejected.
- November creation/structure duplication, explicit food copying, EDP availability editing, parent preview, and reviewed publication on every tested viewport.
- Parent date navigation, month history, valid recipient checks, one/several/month email scopes, clipboard text, mailto encoding, and immutable prepared-email snapshots.
- Magic-link success/error feedback with a mocked Auth client. The UI only says a link was sent after Auth succeeds.

## Source review still needed

See `OCTOBER_MENU_REVIEW.md` for the full transcription. Confirm the conservative one-lunch rule, everyday sandwich alternatives, generic breakfast participation, October 15 Pre-K substitution, and October 8 “Tater Tots” small print. EDP is already human-confirmed by Justin: 2–6 pm each school day. October 12 is explicitly no school.

October is a draft in the production seed. Admin publication requires reviewing the menu and service schedule. The isolated demo displays the transcription as a preview so it can be explored before cloud setup.

## Netlify deployment

The connected Netlify account now hosts [the app](https://cheverus-school-menu.netlify.app) and [Storybook](https://cheverus-school-menu.netlify.app/storybook/?path=/story/day-parent-workflow--interactive). The combined `npm run build:netlify` output was deployed first to a draft URL and verified in Chromium: Storybook manager/iframe assets load and lunch + EDP complete a day; the app supports deep links, demo saving, reload restoration, and selection history without runtime/console errors. The verified build was then published to the new site's stable URL.

The deploy contains only the labeled device demo and public menu/component assets. Netlify CLI linkage is ignored by Git. GitHub continuous deployment is still a separate setup step; the CLI deploy does not configure it.

## External setup / not claimed as verified

A dedicated Cheverus Supabase project has not been selected or provisioned; no unrelated cloud project was modified. Apply the migration/seed, set the public URL/key, grant the first administrator role through trusted SQL, and configure Auth Site URL/redirects/email provider as documented in `README.md`.

Live cloud magic-link delivery, Supabase REST/PostgREST behavior on the selected project, and cloud database advisors should be checked after that connection. Local database tests validate the PostgreSQL security model without pretending to validate those external services.

Opening a mailto draft cannot confirm sending or delivery. History labels record prepared/copied drafts and requests to open the email app. The proposed 10/20-second human usability targets were not measured with actual parents; the automated flows verify the required interactions and phone layouts.
