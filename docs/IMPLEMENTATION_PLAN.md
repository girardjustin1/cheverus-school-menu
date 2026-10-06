> Updated backend decision: Justin requested Netlify only. The implemented backend now uses Netlify Identity, Functions, and Netlify Database. The discovery notes below retain the original product plan; the current architecture and setup are documented in README.md.

# Cheverus daily plans — implementation plan

## Discovery (October 6, 2026)

The local project contains only references and a school logo; the GitHub repository has no commits. Initialize `main`, then implement on `feature/mvp-school-meals-edp`. The source screenshot has been visually inspected at original resolution: `references/Screenshot 2026-10-06 at 8.31.21 AM.png` (the filename contains a narrow no-break space). The supplied PDF is retained as a supporting original reference.

## Source interpretation

The calendar spans September 28–October 30. Import October only: 22 weekdays, 21 service days, with October 12 explicitly marked “No School Today.” Each school day offers one calendar entrée and two everyday alternatives: Jammie Sunbutter and Jelly Sandwich (V), and American Cheese on Wheat Bread (V). Model one required single-choice lunch category. Sides, fruit, and choice of milk describe the complete meal; they are informational and are not separate required selections. October 15 specifies a Pre-K cheeseburger substitution; display it explicitly and request grade applicability review.

Breakfast is present in the footer: daily grab-and-go, whole grain items, fruit or 100% fruit juice, additional fruit/vegetables, and fat-free or 1% milk. Examples include muffins, cereal, cereal bars, breakfast breads, hot breakfast items, and whole grain snacks. The source does not establish which specific items are available on which dates or whether parents may choose them. Use optional breakfast opt-in for October, not invented daily choices; later menus support item selection and single/multiple/informational categories.

EDP is absent from the source. Represent availability as `true` (confirmed available), `false` (confirmed unavailable), or `null` (awaiting school confirmation). Do not equate unknown with unavailable or silently enable EDP. Justin confirmed during implementation that EDP runs every day from 2–6 pm; October school days therefore use confirmed availability and these hours. No-school dates have all services disabled. Future dates awaiting EDP confirmation display a distinct status; breakfast never blocks completion.

## Data and security

Use the requested profiles, children, menu_months, menu_days, menu_categories, menu_options, daily_requests, and meal_selections tables. Add `breakfast_mode` (`opt_in`/`choices`) to days and nullable EDP availability. Keep meal type independent from EDP. Add immutable email draft snapshots so parents can retrieve exactly what they previously prepared, even after editing a request or menu. Label these as prepared/opened drafts; mailto cannot confirm actual sending.

RLS on every public table. Parents own all family data. Admin role lives in profiles, cannot be changed by a parent, and is assigned only through trusted database administration. Published menus are readable to authenticated users. Keep archived menu content readable where it supports a parent's existing history. Validate ownership, date, option/category membership, availability, and category selection mode in an atomic database RPC. Serialize saves per browser session; show failures and explicit retry without dropping the intended values. Do not store privileged keys.

## Components, routes, and visual design

MUI foundation with warm ivory, school-inspired deep green, restrained yellow accents, large controls, clear focus, and readable type. The provided school logo supplies authentic branding. Native snapping date rail; whole-card meal controls; separate optional breakfast panel and EDP attendance panel. Phone widths 375–430px first, with a wider two-column daily plan and monthly progress panel on desktop.

Routes: `/login`, `/auth/callback`, `/menu`, `/selections`, `/email`, `/profile`, `/admin/menus`. Protect family routes with Supabase Auth and admin routes with server-backed role checks. A clearly labeled, isolated device-only demo is available without Supabase credentials to inspect the entire MVP; it never pretends to send magic links or save to the school.

Storybook hierarchy: Foundations (theme), Navigation (DateRail), Meals (MealOptionCard, LunchSection, BreakfastSection), EDP (EdpAttendanceSelector), Day (DailyPlan and completion), Selections (MonthSelectionSummary), Email (EmailPreview), Forms (ChildForm), Feedback (save/error states). Build interactive major components and stories before backend integration.

## Implementation phases

1. Record discovery and detailed source review before heavy implementation.
2. Initialize Vite, React, TypeScript, MUI, Router, Storybook, Vitest, RTL, Playwright, ESLint, Prettier, and Netlify configuration.
3. Build and inspect component stories and interactive daily workflow.
4. Store the October transcription as structured JSON, generate deterministic database seed data from it, and preserve source notes.
5. Create Supabase migrations, Auth/session handling, RLS, transactional request saving, and database integration/security tests.
6. Connect children, daily autosave, month history, email scope/preview/copy/mailto, and immutable draft history.
7. Implement menu creation, category rules, service/day/option editors, structure duplication (food copying opt-in), parent preview, and publication.
8. Document cloud configuration and Netlify deployment; add SPA redirects and CI.
9. Run lint, typecheck, unit/component/database tests, production build, Storybook build, mobile/desktop E2E, inspect diff, make coherent commits, and prepare PR against main.

## Human confirmation / external setup

- EDP confirmed by Justin October 6: 2–6 pm every school day. Source alone does not establish this; record the human confirmation separately.
- Confirm lunch choice rule (one entrée or one daily sandwich), sandwich availability, and applicability of the October 15 Pre-K substitution.
- Confirm breakfast is requested as general participation rather than guaranteed item choice.
- Confirm teacher/school email through profile; never invent a recipient.
- Justin will connect Netlify. Supabase project configuration remains a separate setup step for cloud authentication/private database; no unrelated Supabase project is modified. Cost confirmation is required by the Supabase project creation tool if provisioning later.
- Seed October as draft in production, requiring admin review before publication. Demo labels the October transcription as a preview.
- Configure Supabase Site URL/redirect allowlist and Netlify environment variables for actual production sign-in/deployment. A local database test can verify schema/RLS independently of those credentials.
