# Image Helper

A Chrome (Manifest V3) extension with:

- A **side panel** with three tabs: Main (page → markdown), Profile, About.
- An **options page** backed by `chrome.storage.sync`.
- A **content script** ↔ **side panel** messaging example (HTML → Markdown via Turndown).
- A **background** service worker that opens the side panel on a keyboard shortcut.

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
4. Pin the toolbar icon and click it to open the side panel. The default keyboard shortcut is `Ctrl+Shift+O` (Mac: `MacCtrl+Shift+O`).

## Layout

```
src/
  background.ts             Service worker, registers keyboard command.
  content_script.tsx        Listens for messages, converts DOM → markdown.
  side_panel.tsx            Side-panel entry (React root).
  options.tsx               Options page entry.
  common/
    messages.ts             Request/response types shared across surfaces.
    chrome.ts               sendMessageToTab helper.
    markdown.ts             Turndown service + rules.
    globalConfig.ts         Env-derived config (environment, version).
  contexts/
    TabsContext.tsx         Tracks the active tab.
    UserProfileContext.tsx  Local-only placeholder profile (chrome.storage.local).
    OptionsContext.tsx      Single placeholder option (chrome.storage.sync).
  hooks/
    useHtmlParser.ts        Side-panel → content-script round-trip.
  side_panel/SidePanel.tsx  Main / Profile / About tabs.
  options/Options.tsx       Options form.
```
