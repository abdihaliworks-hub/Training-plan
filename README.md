# Training-plan
Just posting my training plans as it changes and stuff, using AI to build me easily accessible sites that structure it so that can access the files cross platform

## Project structure

```
index.html              Page content (markup only)
css/styles.css          All styling, incl. responsive rules for phone / tablet / desktop
js/app.js               All behaviour (navigation, week data, accordions) + service worker registration
manifest.webmanifest    App manifest — makes the site installable as an app
sw.js                   Service worker — offline support once installed
icons/                  App icons (home screen, splash, maskable Android icons)
```

## Using it as an app on Android

The site is a Progressive Web App (PWA). To install it, it has to be served over HTTPS. GitHub Pages works for this:

1. On GitHub, open **Settings → Pages**, set **Source** to *Deploy from a branch*, choose the branch (e.g. `main`) and `/ (root)`, then save.
2. After a minute it is live at `https://<your-username>.github.io/Training-plan/`.
3. Open that link in **Chrome on Android**, tap the **⋮** menu, then **Install app** (or **Add to Home screen**).

It then opens full-screen from its own icon and works offline.

> When you change any file, bump `CACHE_VERSION` in `sw.js` (e.g. `training-plan-v2`) so installed copies pick up the update.

## Running locally

Service workers don't run from `file://`, so serve the folder instead:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
