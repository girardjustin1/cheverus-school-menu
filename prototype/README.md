# Local experience prototype

This checkout is for GUI exploration before database and product decisions are finalized. The user has authorized publishing this sample-data prototype and its Storybook to GitHub Pages, and opening a PR for those changes. Do not deploy to Netlify or update its configuration. Include `[skip netlify]` in every pushed commit and in the PR title to suppress automatic Netlify builds and previews.

The public prototype is at `https://girardjustin1.github.io/cheverus-school-menu/`. Its component Storybook is at `https://girardjustin1.github.io/cheverus-school-menu/storybook/`. These URLs work on mobile data while the Mac is off. The GitHub Pages workflow publishes from `codex/local-experience-prototype` and, once its source is merged there, from `main`. Pull requests only build and validate; they do not publish.

GitHub Pages uses hash routes so navigation and refreshes work without a server. To build and preview the same project-path setup locally, run `PROTOTYPE_BASE_PATH=/cheverus-school-menu/ npm run build:prototype`, then `PROTOTYPE_BASE_PATH=/cheverus-school-menu/ npm exec vite -- preview --config vite.prototype.config.ts --host 0.0.0.0 --port 5176`. Open `http://localhost:5176/cheverus-school-menu/`. The build base also sets logo and asset paths.

Run `npm run prototype` from this checkout. The standalone app runs on port 5175, binds to all local network interfaces, and uses the same responsive components and pages as the app. A phone on the same Wi-Fi can open `http://<Mac Wi-Fi IP>:5175`. Keep the Mac awake and the server running. This is a local network address, not a public deployment.

Run `npm run storybook:prototype -- --ci` to explore the component stories separately on port 6007. The original checkout and Storybook on port 6006 are independent.

The standalone app substitutes local sample repositories, simulated authentication, and a preview for opening emails. It imports no cloud SDK implementation, loads no production environment files, and rejects API requests. Sample meals, family changes, menu changes, and email snapshots save only to this browser's local storage. Phone and desktop samples are separate. There is no database, cloud authentication, or school submission.

Use **Prototype tools** to load parent planning, month review, a completed email, family setup, first-child setup, school administration, simulated sign-in, a no-school date, or a save interruption. Switching scenarios or resetting replaces the sample data. Normal refreshes retain sample choices.

`npm run build:prototype` produces a standalone static frontend in the ignored `dist-prototype` directory. It does not upload anything.

Verified October 6, 2026: standalone build, TypeScript, lint, and all 62 existing unit tests pass. Browser checks over the LAN address cover meal and EDP selection, persistence after refresh, monthly review, email preview and copying, email snapshots, adding a child and refreshing, simulated sign-in, admin rendering, and retrying a simulated save failure. Parent and admin pages fit a 375-pixel viewport without horizontal page overflow. API requests return 403, and the built frontend contains no cloud SDK or database/API implementation. The independent Storybook serves 44 stories.
