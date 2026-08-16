# Cymor Movie Hub

Premium movie discovery, streaming, and authorized-download frontend for **Legendary Smiley Cymor**.

## Run

From this directory:

```bash
npm install
npm run dev
```

The production bundle is built with `npm run build` and can be served with `npm run serve`.

## API configuration

The client uses browser `fetch` and defaults to:

```text
https://movieapi.xcasper.space
```

To point at another compatible service, create a `.env` file with:

```text
VITE_API_BASE=https://your-api.example
```

Endpoint calls are centralized in `src/lib/api.ts`, with defensive normalization for different response shapes. The app tries compatible provider endpoints in sequence for playback and authorized files.

## PWA

`public/manifest.webmanifest` and `public/sw.js` are included. The service worker is registered by the app, and supported browsers expose an in-app install prompt when the `beforeinstallprompt` event is available.

## Rights

Cymor is a discovery interface. Users should only stream or download titles they are authorized to access. The app does not bypass DRM or access controls.