# CLAUDE.md

## Dev Preferences

- After each change, run `yarn lint`, `yarn typecheck`, and `yarn test` to ensure no errors.
- DRY the code when appropriate.
- Always use curly braces after `if` statements.
- Always think about adding unit tests for new features and bug fixes. Aim for good coverage on critical parsing logic and workflows. But skip unit tests if it involves complicated mocking or stubs.
- In unit tests, use `it.each` to group similar test cases together. Do not use "should" in test descriptions.
- When a React component file is long, separate subcomponents into their own component files.
- After making a change, thinking about updating these docs, if applicable:
  - `CLAUDE.md` (this file)
  - `README.md`
- `prettier-plugin-sort-imports` will reorder imports, so `eslint-disable-next-line` directives that target an import must sit on the line immediately above that import (not at the top of the file) or they end up orphaned.

## Project Architecture

- Chrome MV3 extension. Three entry points:
  - `src/background.ts` — service worker. Handles action-click toggle, HEAD fetches, and `chrome.downloads.download` requests.
  - `src/content_script.ts` — **plain TS, no React**. Observes `<img>`, renders a shadow-DOM floating toolbar. Keep it React-free to keep the injected bundle small.
  - `src/options.tsx` — React + Tailwind options page. Styled with plain HTML controls, no component library.
- Tailwind v4 via `@tailwindcss/postcss`. The content script imports `./styles/tailwind.css?raw` and injects the string into its shadow root. **Tailwind preflight does not cross shadow-root boundaries**, so set explicit utilities like `font-sans` on the toolbar container rather than relying on the cascade.

## Toggle + State Fan-out

- Single source of truth: `chrome.storage.local` key `image_helper_active` (default `false`).
- `chrome.action.onClicked` flips it; background re-syncs icon + title + `On`/`Off` badge, and also listens to `storage.onChanged` so any other writer stays in sync.
- Content scripts subscribe to `chrome.storage.onChanged` directly. Do **not** add background→tab messaging for activation — Chrome delivers storage-change events to every listener for free.
- When inactive, the content script disconnects its `MutationObserver` + `IntersectionObserver` and removes the document-level middle-click handler. Keep the off-state hot path free of fetches, timers, and DOM scans.

## Permissions Policy

- Kept minimal: `storage`, `downloads`, `host_permissions: ["<all_urls>"]` (for cross-origin HEAD size checks from the service worker).
- Do not add `tabs`, `sidePanel`, `scripting`, `activeTab`, or a `default_popup` without a clear reason — each one widens the surface. If you need a new permission, justify it in the PR description.

## Download Conventions

- Use `chrome.downloads.download` with `conflictAction: 'uniquify'`. Chrome handles the ` (N)` filename suffix automatically — do not reimplement this.
- Paths must be **relative to Chrome's default Downloads directory**. `chrome.downloads` cannot write outside it. The configurable "download directory" option is therefore a subfolder under Downloads.
