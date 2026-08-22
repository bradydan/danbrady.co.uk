# Eleventy portfolio site — design

**Date:** 2026-08-22
**Status:** Approved

## Context

`danbrady.co.uk` will be Dan Brady's documentary photography portfolio. The
repo currently contains a Claude Design canvas prototype (`index.html`,
`nocturne.css`, `image-slot.js`, `support.js` — the `dc-runtime` component
format: `x-dc`, `sc-if`, `{{ }}` bindings compiled to React in-browser). This
is the visual reference for layout, typography, spacing, and the dark/light
theme, not runnable production markup. The production site will be a static
Eleventy build with real Nunjucks templates and plain CSS, matching that
design pixel-for-pixel where practical.

## Goals

- Static site generator: Eleventy (`@11ty/eleventy`, latest 3.x), Nunjucks
  templating.
- WebP image optimization via `@11ty/eleventy-img`.
- `sitemap.xml` via `@quasibit/eleventy-plugin-sitemap`.
- Per-page SEO metadata (title, description, canonical, Open Graph, Twitter
  Card, JSON-LD) via a hand-rolled partial — no single dominant "Eleventy SEO
  plugin" exists, and a partial keeps control over what matters for a photo
  site (OG image, alt text).
- Content authored as one markdown file per project, with front matter.
- Deployed via GitHub Actions to Bunny.net (Storage zone), triggered on push
  to `main`.
- Placeholder images for the initial build; Dan will supply real photographs
  later.

## Non-goals

- Reusing the `dc-runtime` templating syntax in production. It's a design
  tool artifact, not meant to ship.
- Wiring up the actual Bunny credentials/secrets — the workflow will be
  built to read them from GitHub Actions secrets, but adding those secrets
  and verifying a live deploy happens later, when Dan has Bunny zone details
  ready.
- Committing full-resolution source photographs to git. Large binary
  originals don't belong in this repo's history; that's a separate decision
  for Dan to make (plain directory outside git, Git LFS, or a Bunny Storage
  source bucket) once real photos are ready.

## Project structure

```
src/
  _data/
    site.js            # site title, url, author "Dan Brady", social/OG defaults
  _includes/
    layouts/
      base.njk          # <html> shell, header/nav, theme toggle, footer
      project.njk        # single project page (gallery + lightbox viewer)
    partials/
      seo.njk            # meta/OG/Twitter/JSON-LD, driven by front matter + site data
      nav.njk            # desktop nav + mobile burger menu
  projects/
    feast-day.md
    night-shift.md
    the-last-ferry.md
    ...                  # one markdown file per project, front matter below
  images/
    feast-day/           # source photos per project (placeholders initially)
    night-shift/
    ...
  about.md
  contact.md
  index.njk              # home page: hero + inset project previews
  projects.njk           # projects index
.eleventy.js
package.json
.github/
  workflows/
    deploy.yml
```

### Project front matter

```yaml
---
title: Feast Day
location: Oaxaca
year: 2022
order: 0
cover: feast-day/cover.jpg
description: Documentary work on a saint's day feast, shot over two weeks.
photos:
  - src: feast-day/01.jpg
    alt: Placeholder — replace with real caption
  - src: feast-day/02.jpg
    alt: Placeholder — replace with real caption
---
```

`photos` drives both the project gallery grid and the full-screen viewer.
`order` controls home page and project-index ordering (ascending).

## Image pipeline

- Nunjucks shortcode `{% image src, alt, sizes %}` wraps `eleventy-img`.
- Generates WebP + JPEG fallback at a small width set (e.g. 480/800/1200/1600),
  cached in `.cache/` (already gitignored) so repeat builds are fast.
- Two presets: `cover` sizes (home/project-index thumbnails) and `full`
  sizes (gallery/lightbox viewer) — same shortcode, different `sizes` arg.
- Output: `<picture>` with WebP `source` + JPEG `img` fallback, `srcset`/
  `sizes` attributes, explicit `width`/`height` to avoid layout shift.
- Placeholder images for initial build come from a small set of local
  sample JPEGs checked into `src/images/` (not `picsum.photos` — avoids a
  network dependency in local builds), swapped for real photos later.

## SEO + sitemap

- `_data/site.js`: `{ url, title, description, author: "Dan Brady", social: {...} }`.
- `partials/seo.njk`: reads page-level front matter (`title`, `description`,
  `ogImage`) with sitewide fallback from `site.js`. Emits:
  - `<title>`, meta description, canonical `<link>`
  - Open Graph (`og:title`, `og:description`, `og:image`, `og:type`)
  - Twitter Card (`summary_large_image`)
  - JSON-LD: `Person` on the about page, `ImageGallery` (with `Photograph`
    items) on project pages
- `eleventy-plugin-sitemap` added in `.eleventy.js`, configured with
  `site.url`; generates `sitemap.xml` from the full output tree.
- Hand-written `robots.txt` in `src/`, pointing at `/sitemap.xml`.

## Deploy: GitHub Actions → Bunny Storage

`.github/workflows/deploy.yml`, triggered on push to `main`:

1. `actions/checkout`
2. `actions/setup-node` + `npm ci`
3. `npx @11ty/eleventy` → `_site/`
4. Sync `_site/` to the Bunny Storage zone (FTP or Bunny's REST API via
   `curl`, since there's no official Bunny GitHub Action)
5. Optional: purge the Bunny Pull Zone cache via API call

Required secrets (added later, once Dan has Bunny zone details):
`BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_PASSWORD`, optionally
`BUNNY_PULL_ZONE_ID`. Until those are added, the workflow will run and fail
at the deploy step — build/lint feedback still works on every push.

## Testing

- `npx eleventy` completes without errors and produces expected output
  paths (`_site/index.html`, `_site/projects/feast-day/index.html`, etc.).
- Generated `sitemap.xml` and `robots.txt` present and well-formed.
- Spot-check one project page's rendered `<picture>` markup for correct
  `srcset`/WebP output.
- Manual visual comparison against the `dc-runtime` prototype for home,
  project, about, and contact pages (light + dark theme).
