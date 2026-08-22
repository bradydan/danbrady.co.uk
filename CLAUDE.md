# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run build` — build to `_site/`
- `npm run serve` — dev server with live reload
- `npm run debug` — build with `DEBUG=Eleventy*`

No test suite. Verify by building and inspecting `_site/` output, and by
driving a headless browser (see **Verifying visual work** below).

## What this is

An Eleventy 3 static site: a documentary photography portfolio. `README.md`
is written for the site's owner and covers content management (adding
projects, photos, captions) — read it before changing anything about how
content is authored, since it documents the contract users rely on.

The repo root also contains `index.html`, `nocturne.css`, `image-slot.js` and
`support.js`. These are a **Claude Design canvas prototype** (`dc-runtime`
format: `x-dc`, `sc-if`, `{{ }}` compiled to React in-browser). They are the
original visual reference **only** — not runnable production markup, not part
of the build, and their templating syntax must never be reused in `src/`.

## Established conventions — follow these

**No inline styles. Anywhere.** Every `style="..."` was deliberately removed;
`grep -r 'style="' src/` returns nothing and should keep returning nothing.
All styling lives in `src/css/style.css`, organised into commented sections.
Add a class rather than a style attribute.

**Use the design tokens** in `:root` rather than literal values: `--space-*`
for spacing, `--text-*` for type sizes, `--color-*` for colour, `--measure`
for line length. If a value needs a new step in a scale, add a token.

**Type scale.** Body text and the hero subtitle are 16px/1.5. Captions are
15px. Meta rows under cover images are 14px. All `<h1>` use `.page-title`
(34px) — the home page has no `<h1>`. Small uppercase letterspaced text is
the CTA idiom (`.button`, 13px).

**Buttons are text-only** — underlined label plus a chevron, no border or
fill. Never hand-write one: use the macro.

```njk
{% from "macros/ui.njk" import linkButton %}
{{ linkButton("/projects/", "All projects") }}
{{ linkButton(url, label, "extra-class") }}
```

**Images always go through the shortcode**, never a hand-written `<img>`:

```njk
{% image src, alt, caption, preset, eager %}
```

`src` is relative to `src/images/`. `alt` is **required — the shortcode
throws and fails the build without it**; that is intentional, do not soften
it. `caption` may be null. `preset` is `"cover"` or `"full"`. Pass
`eager: true` only for above-the-fold LCP images (home hero, photo page).

**Never reconstruct eleventy-img output filenames by string manipulation.**
A source narrower than a configured width has no file at that width, because
eleventy-img does not upscale — so guessing `-1600w.jpeg` breaks on smaller
photos. Use the `photoUrl` filter or `largestJpegUrl()` from `lib/photo.js`,
which read eleventy-img's own `statsSync` metadata. `lib/photo.js` is the
single source of the image options shared by the shortcode and those
lookups; if they diverge, generated URLs stop matching files on disk.

**The email address is obfuscated and must stay that way.** `_data/site.js`
defines `CONTACT_EMAIL` and exposes **only** `social.emailEncoded` (a
character-shifted encoding) — there is deliberately no plain value available
to render by accident. Render it via `partials/email-obfuscated.njk`, setting
`emlText` first for the pre-hydration label. A small inline script in
`base.njk` decodes it; its `- 13` must match `encodeEmail()`'s offset. After
touching anything email-related, run:

```sh
~/.claude/skills/email-obfuscator/scripts/audit.sh _site info
```

**Templates are Nunjucks (`.njk`).** Markdown files are processed with
Liquid, so `{% include %}` and `{% set %}` behave differently there — this is
why `contact.md` became `contact.njk`. Keep pages that need Nunjucks tags as
`.njk`. `about.md` is fine because its email link lives in the layout.

## Architecture

**Content model.** One markdown file per project in `src/projects/`; front
matter carries `title`, `location`, `year`, `order` (ascending sort key;
`order: 0` is the home hero), `cover`, `description`, and
`photos: [{src, alt, caption}]`. Photograph files live in
`src/images/<project-slug>/`, folder name matching the markdown filename.

**Collections** (`.eleventy.js`): `projects` sorts by `order`. `photos`
flattens every project's photos and precomputes `url`, `slug`, `date`,
`position`/`total` and prev/next siblings.

**Per-photo pages.** `src/photo.njk` paginates (`size: 1`) over
`collections.photos` to produce `/projects/<project>/<frame>/`. A photo's
filename becomes its URL slug. Gallery items on project pages are real `<a>`
links to these pages, so frames are shareable and work without JS;
`lightbox.js` intercepts plain left-clicks only (modified clicks still open a
new tab).

**SEO.** `partials/seo.njk`, included from `base.njk`, reads `title`,
`description`, `ogImage`, `isAbout`, `isPhoto`, `photos`. Emits OG/Twitter
tags plus JSON-LD: `Person` when `isAbout`, `Photograph` when `isPhoto`,
`ImageGallery`/`ImageObject` when `photos` is present.

**Sitemap.** `src/sitemap.njk` is hand-written; there is no sitemap plugin.
`@quasibit/eleventy-plugin-sitemap` was removed because it spreads the
Eleventy template object, triggering the `templateContent` getter and
crashing on paginated templates in Eleventy 3. It also carries
per-photograph `<image:image>` entries, which the plugin could not do.
**Photo-page URLs are iterated from `collections.photos`, not
`collections.all`** — paginated pages are not reliably in `collections.all`
when the sitemap renders, and switching that loop back will silently emit
only the first paginated page.

**Client JS** is vanilla, no framework, and each script no-ops harmlessly on
pages without its markup: `js/site.js` (mobile menu, theme toggle),
`js/lightbox.js` (gallery viewer, reads photo data from an inline
`application/json` block rendered by `layouts/project.njk`). The theme is
applied by a **blocking** inline script in `<head>` — deferring it causes a
flash of the wrong theme on every navigation.

**Deploy.** `.github/workflows/deploy.yml` builds on push to `main` and syncs
`_site/` to Bunny Storage via a SHA-pinned third-party action. Requires
`BUNNY_STORAGE_ZONE` / `BUNNY_STORAGE_PASSWORD` secrets, which are **not yet
configured** — the deploy step is expected to fail. That is not a bug to
chase.

## Verifying visual work

The Chrome extension has been unavailable in this environment. Playwright is
installed in the session scratchpad and is the working approach — launch
chromium, navigate to the dev server, and read *computed styles and
geometry*, not just the screenshot. Several real bugs here (stretched images,
misaligned rows, an unstyled button) were only pinned down by reading
`getComputedStyle` and `getBoundingClientRect`.

Check both a desktop (1440×900) and mobile (390×844) viewport; assert
`document.body.scrollWidth - window.innerWidth === 0` to catch horizontal
overflow, and listen for `pageerror` to catch JS breakage.

## Gotchas already hit

- `eleventy-img` emits `width`/`height` attributes, which browsers map to a
  literal CSS `height`. The reset needs `height: auto` or images stretch.
- `<button>` vertically centres its contents in a stretched grid cell, which
  misaligned gallery rows with optional captions. `.gallery-grid` uses
  `align-items: start`.
- An inline `display:flex` beat the UA's `[hidden] { display: none }`, so the
  lightbox could not be closed. It now toggles `style.display` in JS.
