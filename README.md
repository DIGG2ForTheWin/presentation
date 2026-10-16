# DIGG final presentation

A keyboard-driven animated presentation in plain HTML, CSS and JavaScript (native ES modules). There is no build step, package manager or dependency: the repository root is the published site.

## Prerequisites

- A current browser.
- Any static HTTP server, for example an editor's live-server extension. ES modules don't load from `file://`, so the page must be served over HTTP.

## Local preview

Serve the repository root and open `index.html`. Check every change this way before pushing.

## Structure

```
.nojekyll            empty; GitHub Pages serves the files as-is
index.html           the only page: stage container, styles.css, src/main.js
styles.css           theme tokens, fluid stage, base state, theme backdrop
content.js           the single content source: every shown value, with its origin
src/
├── main.js          part order + startup
├── controller.js    step controller: keyboard input and every animation
└── parts/           one module per part: its scene and its steps
```

## Publishing

GitHub Pages publishes the `main` branch, folder `/`. Every push to `main` goes live.

Browsers may keep cached files for up to 10 minutes after a deployment. Before a rehearsal or the talk, hard-reload the page, or open it at least 10 minutes after the last deployment completed.

## Rules

- Use relative paths only. The site is served from a subpath (`https://<owner>.github.io/<repo>/`).
- Everything committed to `main` is public. Never commit evidence, raw data, project documentation or credentials.
- Vendor fonts, images and libraries into the repository. Never load them from a CDN.

## Checks

There is no build, lint, format or test tooling. Check by opening the page locally, and by a full forward and backward rehearsal from the hosted URL.
