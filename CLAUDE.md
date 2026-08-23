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

The repo root once held a **Claude Design canvas prototype** — `index.html`
plus `nocturne.css`, `image-slot.js` and `support.js`, in `dc-runtime` format
(`x-dc`, `sc-if`, `{{ }}` compiled to React in-browser). It was the original
visual reference only and never part of the build. All four have been deleted
now that the real site has moved past them; they survive in git history, and
`docs/superpowers/` records the design intent. Older notes in there still
refer to `nocturne.css` as though it were present — that is a historical
record, not a live reference. Never reintroduce that templating syntax into
`src/`.

## Established conventions — follow these

**No inline styles. Anywhere.** Every `style="..."` was deliberately removed;
`grep -r 'style="' src/` returns nothing and should keep returning nothing.
All styling lives in `src/css/style.css`, organised into commented sections.
Add a class rather than a style attribute.

**Use the design tokens** in `:root` rather than literal values: `--space-*`
for spacing, `--text-*` for type sizes, `--color-*` for colour, `--measure`
for line length. If a value needs a new step in a scale, add a token.

**`--color-accent` is one hue at two lightnesses, and both must be set.** The
dark theme uses a coral (`#c8836a`); the light theme deepens it to
`#a8432c`, because no coral light enough to read as coral clears 4.5:1
against the cream light-theme background. Change one and you must change the
other. The accent is body-sized link text (`.link-accent`, `.button` at 13px)
and a focus ring, so it needs 4.5:1 against **both** `--color-bg` and
`--color-surface` in its own theme — check before changing it; the purple this
replaced failed at 3.28:1 and 4.27:1. Anything placed *on* the accent uses
`var(--color-bg)`, not a literal `#fff`, so it follows the theme (see
`.skip-link`).

**`src/favicon.svg` is the wordmark's "D" as an outline, not text.** It is the
Figtree glyph at weight 400 to match `.brand`, converted to a `<path>` so it
renders identically everywhere — an SVG favicon cannot rely on a webfont
loading. Regenerate it from `src/fonts/figtree-latin.woff2` rather than
editing the path by hand.

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
it. `caption` may be null. Pass `eager: true` only for above-the-fold LCP
images (home hero, photo page).

`preset` selects the `sizes` attribute, and **there is one preset per layout
context**, because `sizes` has to describe the width the image actually
renders at: `"cover"` (projects grid), `"hero"` (home hero), `"gallery"`
(project gallery), `"full"` (per-photo page), and the `inset76/88/70/52`
family for the home insets — picked by position via the `insetPreset` filter,
never named directly. Over-declaring makes browsers fetch a file larger than
they can show; under-declaring makes the photograph look soft. **If you change
a layout width in `style.css`, change the matching preset in `lib/photo.js`.**
Presets sharing a `widths` array share the files on disk, so varying only
`sizes` costs nothing at build time.

**Never reconstruct eleventy-img output filenames by string manipulation.**
A source narrower than a configured width has no file at that width, because
eleventy-img does not upscale — so guessing `-1600w.jpeg` breaks on smaller
photos. Use the `photoUrl` filter or `largestJpegUrl()` from `lib/photo.js`,
which read eleventy-img's own `statsSync` metadata. `lib/photo.js` is the
single source of the image options shared by the shortcode and those
lookups; if they diverge, generated URLs stop matching files on disk. The
lightbox builds its `<img>` in JS and so cannot use the shortcode — it is fed
generated URLs by the `lightboxPhotos` filter. It must never be pointed back
at `src/images/`; those originals are deliberately **not** copied to the
output, and doing so would ship unresized multi-megabyte files.

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

**Fonts are self-hosted.** Figtree lives in `src/fonts/` and is declared in
the Fonts section of `style.css`. It is a variable font, so one file per
unicode-range serves every weight (400–600). Do not reintroduce the Google
Fonts `<link>`: a third-party stylesheet is render-blocking and was the only
external request on the site. `base.njk` preloads the latin file because the
browser would otherwise not discover it until the stylesheet is parsed.

**Photographs carry copyright metadata and licensing markup.** Two halves of
one thing, and both read their strings from `licensing` in `_data/site.js` so
they cannot drift apart:

- *In the files.* A `formatHooks` hook in `lib/photo.js` embeds EXIF
  `Copyright`, `Artist` and `ImageDescription`, each linking back to the site,
  so attribution survives a download. A format hook is the only place
  eleventy-img exposes the sharp instance, and **a hook takes over encoding**
  — it must call `.toFormat()` and return a Buffer itself. Supplying
  `formatHooks` also replaces eleventy-img's default object, which holds its
  built-in SVG hook (harmless here; no SVG goes through the shortcode).
- *In the markup.* `partials/seo.njk` emits `license`, `acquireLicensePage`,
  `creditText` and `copyrightNotice` on every image. Photo pages are typed
  `["ImageObject", "Photograph"]` — Google's image-licensing documentation
  requires `ImageObject`, and dropping it loses the Licensable badge in Google
  Images. The `license` and `acquireLicensePage` values must be **absolute**
  URLs. `/licensing/` is the page the licence links point at.

Three traps, all verified rather than assumed:

1. **eleventy-img's disk cache is a bare `fs.existsSync` on the output path,**
   and `formatHooks` is not part of its options hash (only the five
   `sharp*Options` objects are). With this project's hash-free
   `filenameFormat`, **changing the EXIF strings does not regenerate images
   that already exist** — move `_site/img` aside and rebuild, or you will
   verify against stale files.
2. **libvips stores EXIF as `value (type info)` and strips the trailing
   parenthetical on write, so a `(` in a value silently truncates it.** Never
   put parentheses in an EXIF string; the URL after one disappears with no
   error.
3. **EXIF strings are 7-bit ASCII** — sharp transliterates, turning `©` into
   `(C)` and an em dash into `--`. Keep the punctuation plain.

**Images are emitted as AVIF, WebP and JPEG,** in that order, so browsers take
the smallest they support. JPEG stays last and is what `photoUrl` returns for
`og:image` and the sitemap, since crawlers and social unfurlers are least
likely to decode AVIF.

**Every page emits an `og:image`.** `partials/seo.njk` resolves it in order:
the frame itself on photo pages, the project `cover` on project pages, then a
site-wide fallback (the `order: 0` cover). Values interpolated into JSON-LD go
through `| dump | safe`, never bare `"{{ ... }}"` — a caption containing a
quote would otherwise emit invalid JSON.

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
