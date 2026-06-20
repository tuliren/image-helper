# Image Helper

A Manifest V3 browser extension (Chrome and Firefox) that adds a floating toolbar to every large
image on the page with two actions:

- **Open image in new tab**
- **Save image** (to a configurable subfolder under your default Downloads directory; duplicate
  names are disambiguated with ` (N)` suffixes automatically)

## Features

- Activate / deactivate by clicking the extension's toolbar icon. The icon switches between
  outline (inactive) and filled (active) so the current state is obvious. Deactivated by default.
- Toolbar appears on hover over images whose `Content-Length` meets the configurable **KB
  threshold**. When a host doesn't expose a measurable size — it rejects the `HEAD` request
  (e.g. `405`) or omits `Content-Length` — the extension fails open and falls back to the
  image's rendered dimensions so the toolbar still works instead of silently disappearing.
- Optional **middle-click shortcut** that runs Open or Save without showing the toolbar.
- Once an image has been saved during the current page session, the Save button swaps to a
  "Saved" variant. Memory is cleared on page refresh.

## Permissions

Kept minimal:

- `storage` — persist options and the global active flag.
- `downloads` — save images to a relative subfolder with `conflictAction: 'uniquify'`.
- `host_permissions: <all_urls>` — HEAD-check image sizes from the background service worker.

## Develop

```sh
yarn install
yarn dev            # webpack --watch
```

## Build

```sh
yarn build-dev              # both browsers → dist/chrome and dist/firefox (dev manifests)
yarn build-dev:chrome       # Chrome only   → dist/chrome
yarn build-dev:firefox      # Firefox only  → dist/firefox

yarn build-prod             # both browsers → dist/chrome and dist/firefox (prod manifests)
yarn build-prod:chrome      # Chrome only   → dist/chrome
yarn build-prod:firefox     # Firefox only  → dist/firefox
```

Each build uses `public/common` (shared assets + icons) plus `public/<browser>/<dev|prod>/manifest.json`.

## Load as an unpacked extension

### Chrome

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose `dist/chrome`.
4. Pin the Image Helper icon. Click it once to activate on the current and future pages.
5. Open the options page (right-click the icon → Options) to set threshold, subfolder, and
   middle-click behavior.

### Firefox

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on…** and select any file inside `dist/firefox` (e.g. `manifest.json`).
3. The toolbar icon appears in the extensions menu — pin it and click to activate.
4. Firefox MV3 runs the background as an event page, not a service worker. Everything else
   (options page, content script, downloads) works the same as Chrome.

## Layout

```
src/
  background.ts             Service worker: toggle state, HEAD + download handlers.
  content_script.ts         Observes images, renders the shadow-DOM toolbar, handles middle-click.
  options.tsx               Options page React root.
  common/
    filename.ts             Derive a safe download filename from URL + content type.
    logging.ts              Dev-only console wrapper.
    messages.ts             Request/response types shared with the service worker.
    options.ts              Options model + chrome.storage wrappers (no React deps).
    sizeCache.ts            Per-URL HEAD response cache with request deduplication.
  contexts/OptionsContext.tsx   Options page React context.
  options/Options.tsx       Options form (Tailwind).
  styles/tailwind.css       Tailwind v4 entry, imported by the options page and content script.
```
