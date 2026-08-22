# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state

This repo does not yet contain a buildable site — there is no `package.json`
and no build/lint/test commands exist. What's here:

- `index.html`, `nocturne.css`, `image-slot.js`, `support.js` — a Claude
  Design **canvas prototype** (the `dc-runtime` component format: `x-dc`,
  `sc-if`, `{{ }}` bindings compiled to React in the browser via
  `support.js`). This is the **visual design reference only** — pixel
  reference for layout, spacing, typography, and the dark/light theme
  tokens. It is not runnable production markup and its templating syntax
  (`{{ }}`, `sc-if`, `onClick=`) must not be reused as-is in the real site.
- `docs/superpowers/specs/2026-08-22-eleventy-portfolio-design.md` — the
  approved design spec for the production site. **Read this before
  scaffolding or making structural decisions** — it defines the Eleventy
  project layout, content model, image pipeline, SEO/sitemap approach, and
  deploy target below.

## Target architecture (per the approved spec)

The production site will be a static Eleventy build (Nunjucks templates)
that visually matches the `dc-runtime` prototype but is implemented as real
templates + plain CSS. Key decisions already locked in:

- **Content model**: one markdown file per project under `src/projects/`,
  front matter holds `title`, `location`, `year`, `order`, `cover`,
  `description`, and a `photos: [{src, alt}]` list. `order` drives home page
  and project-index ordering.
- **Images**: `@11ty/eleventy-img` via a `{% image src, alt, sizes %}`
  shortcode, generating WebP + JPEG fallback `<picture>` markup with
  `srcset`. Two presets — `cover` (thumbnails) and `full` (gallery/lightbox).
  Source photos live in `src/images/<project-slug>/`. Placeholders use local
  sample JPEGs (not `picsum.photos` — no network dependency in local
  builds); real photos are not yet in the repo.
- **SEO**: hand-rolled `partials/seo.njk` (no dedicated plugin) reading
  page front matter with sitewide fallback from `_data/site.js`
  (`url`, `title`, `description`, `author: "Dan Brady"`). Emits OG/Twitter
  tags and JSON-LD (`Person` on about, `ImageGallery`/`Photograph` on
  projects).
- **Sitemap**: `@quasibit/eleventy-plugin-sitemap`, configured from
  `site.js`'s `url`.
- **Deploy**: GitHub Actions on push to `main` — build with `eleventy`,
  sync `_site/` to a Bunny.net Storage zone (no official Bunny Action;
  use FTP or the Bunny REST API). Secrets (`BUNNY_STORAGE_ZONE`,
  `BUNNY_STORAGE_PASSWORD`) are not yet configured.

Full file-tree layout, front-matter schema, and shortcode details are in
the spec doc above — don't duplicate them here from memory; re-read the
spec if unsure.

## Commands

None yet — no `package.json` exists. Once the Eleventy scaffold lands,
this section should be updated with the real `build`/`serve`/`test`
scripts from `package.json`.
