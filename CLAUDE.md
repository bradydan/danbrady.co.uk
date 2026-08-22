# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — build the site to `_site/` (plain `eleventy`).
- `npm run serve` — build and serve with live reload (`eleventy --serve`).
- `npm run debug` — build with Eleventy debug logging (`DEBUG=Eleventy*`).

There is no test suite; correctness is verified by inspecting `_site/`
output after a build (expected routes, no leaked `undefined`/template
syntax, required `alt` text present — see the spec's Testing section).

## Architecture

Static Eleventy build (Nunjucks templates, `src/` → `_site/`). The
production design is a real reimplementation of a Claude Design canvas
prototype that still lives at repo root (`index.html`, `nocturne.css`,
`image-slot.js`, `support.js` — the `dc-runtime` component format: `x-dc`,
`sc-if`, `{{ }}` bindings compiled to React in the browser). That prototype
is a **visual reference only** — not runnable production markup, and its
templating syntax must never be reused in `src/`.

The full design spec (content model, image pipeline, SEO/sitemap approach,
deploy target) is at
`docs/superpowers/specs/2026-08-22-eleventy-portfolio-design.md`. The
implementation plan (task-by-task build log, including two corrections
made against the spec during implementation) is at
`docs/superpowers/plans/2026-08-22-eleventy-portfolio-site.md`. Read
these before making structural changes rather than re-deriving the
architecture from the code.

**Content model**: one markdown file per project under `src/projects/`,
front matter holds `title`, `location`, `year`, `order` (ascending sort
key for home/project-index), `cover`, `description`, and a
`photos: [{src, alt, caption}]` list — `alt` is required on every photo,
`caption` is optional short visible text. The `projects` collection
(`.eleventy.js`) sorts by `order`.

**Images**: `src/_includes/shortcodes/image.js` wraps `@11ty/eleventy-img`,
registered as the async Nunjucks shortcode
`{% image src, alt, caption, preset %}` (`preset` is `"cover"` or
`"full"` — see `PRESETS` in that file for exact widths). Emits a
`<figure>` with a WebP/JPEG `<picture>` and an optional `<figcaption>`.
Source photos live in `src/images/<project-slug>/`; currently these are
locally-generated placeholder JPEGs (`scripts/generate-placeholders.py`,
a one-off dev script, not part of the build) — swap in real photos by
replacing files in `src/images/` with the same relative paths.

**SEO**: `src/_includes/partials/seo.njk`, included from
`layouts/base.njk`, reads page front matter (`title`, `description`,
`ogImage`, `isAbout`, `photos`) with sitewide fallback from
`src/_data/site.js`. Emits OG/Twitter tags and JSON-LD: `Person` when
`isAbout: true` is set (only `about.md`), `ImageGallery`/`ImageObject`
when `photos` is present (project pages) — the `contentUrl` in that
JSON-LD is constructed to match `eleventy-img`'s `filenameFormat` in
`shortcodes/image.js`, so if one changes, check the other.

**Sitemap**: `@quasibit/eleventy-plugin-sitemap` requires an explicit
template calling its shortcode — `src/sitemap.njk` does this
(`{% sitemap collections.all %}`); the plugin registration alone does not
generate `sitemap.xml`.

**Lightbox/mobile menu**: vanilla JS, no framework —
`src/js/lightbox.js` (project-page gallery viewer, reads photo data from
an inline `<script type="application/json">` block rendered by
`layouts/project.njk`) and `src/js/site.js` (mobile burger menu + theme
toggle). Both are loaded on every page via `layouts/base.njk`; each
no-ops harmlessly on pages without their target markup.

**Deploy**: `.github/workflows/deploy.yml` builds on push to `main` and
syncs `_site/` to a Bunny.net Storage zone via a pinned third-party
action. Requires `BUNNY_STORAGE_ZONE`/`BUNNY_STORAGE_PASSWORD` repo
secrets, not yet configured — the deploy step is expected to fail until
they're added; that's not a bug to chase.
