# Image Helper

A Chrome (Manifest V3) extension that adds a floating toolbar to every large image on the page
with two actions:

- **Open image in new tab**
- **Save image** (to a configurable subfolder under your default Downloads directory; duplicate
  names are disambiguated with ` (N)` suffixes automatically)

## Features

- Activate / deactivate by clicking the extension's toolbar icon. The icon switches between
  outline (inactive) and filled (active) so the current state is obvious. Deactivated by default.
- Toolbar appears on hover over images whose `Content-Length` meets the configurable **KB
  threshold**.
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
yarn build-dev      # → dist (uses .env.development + public/dev/manifest.json)
yarn build-prod     # → dist (uses .env.production + public/prod/manifest.json)
```

## Load as an unpacked extension

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and choose `dist`.
4. Pin the Image Helper icon. Click it once to activate on the current and future pages.
5. Open the options page (right-click the icon → Options) to set threshold, subfolder, and
   middle-click behavior.

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
