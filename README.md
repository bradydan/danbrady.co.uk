# danbrady.co.uk

Documentary photography portfolio for Dan Brady. Built with
[Eleventy](https://www.11ty.dev/); photographs are optimised at build time
into WebP with JPEG fallbacks.

## Running it locally

```sh
npm install          # once
npm run serve        # dev server with live reload
npm run build        # one-off build into _site/
```

`npm run serve` prints the local URL it picked (usually
<http://localhost:8080>). Edits to templates, CSS and project files reload
automatically.

---

# Managing the site

Everything on the site comes from two places:

| What | Where |
|---|---|
| Project text and photo lists | `src/projects/<project>.md` |
| The photograph files themselves | `src/images/<project>/` |

One markdown file per project, one folder of photographs per project, and the
folder name matches the markdown filename. Nothing else needs touching to add
or change work.

## Adding a new project

1. **Make a folder for the photographs**, named however you want the project
   to appear in URLs — lowercase, hyphens, no spaces:

   ```sh
   mkdir src/images/river-crossing
   ```

   Copy the photographs into it. **The filename of each photo becomes part of
   its web address**, so name them meaningfully — `ferry-deck-dawn.jpg`
   becomes `/projects/river-crossing/ferry-deck-dawn/`. Avoid
   `DSC_0042.jpg`.

2. **Create the matching markdown file** at `src/projects/river-crossing.md`
   (same name as the folder, plus `.md`):

   ```yaml
   ---
   layout: layouts/project.njk
   title: River Crossing
   location: Tyneside
   year: 2026
   order: 5
   cover: river-crossing/ferry-deck-dawn.jpg
   description: One sentence about the project. Shown on the project page and used as its search-result description.
   photos:
     - src: river-crossing/ferry-deck-dawn.jpg
       alt: Deckhand coiling rope as the sun comes up over the river
       caption: Ferry deck, dawn
     - src: river-crossing/waiting-room.jpg
       alt: Two passengers waiting on a bench in an empty terminal
       caption: Waiting room
   ---
   ```

That's it. The project now appears on the home page and the projects index,
gets its own page, gets a page per photograph, and is added to the sitemap.

### What each field does

| Field | Purpose |
|---|---|
| `layout` | Always `layouts/project.njk`. Don't change it. |
| `title` | Project name, shown everywhere. |
| `location`, `year` | Shown under the title and in each photo's metadata. |
| `order` | Sort position, ascending. **`order: 0` is the home page hero.** |
| `cover` | Which photo represents the project in listings. Path relative to `src/images/`. |
| `description` | One sentence. Appears on the project page and as the meta description for search engines. |
| `photos` | The photographs, in the order they should appear. |

## Adding, removing or reordering photos in a project

Edit the `photos:` list in the project's markdown file. The list order is the
display order — move entries up or down to reorder.

To **add** a photo: drop the file into the project's folder in `src/images/`,
then add an entry:

```yaml
  - src: river-crossing/last-sailing.jpg
    alt: The empty car deck as the ferry pulls away
    caption: Last sailing
```

To **remove** one: delete its entry from the list. You can leave the file on
disk; only listed photographs are published.

To **replace** one: overwrite the file in `src/images/` keeping the same
filename, and the site picks it up on the next build. If you change the
filename, update `src` to match — and remember the photo's web address
changes with it.

## Captions and alt text

Every photograph takes two pieces of text, and they do different jobs:

```yaml
  - src: river-crossing/waiting-room.jpg
    alt: Two passengers waiting on a bench in an empty terminal
    caption: Waiting room
```

**`alt` is required.** It describes the photograph for people using screen
readers and for search engines. Write what is actually in the frame. If you
leave it out, **the build fails on purpose** rather than publishing an
inaccessible image.

**`caption` is optional** and is the short line displayed under the
photograph. Leave it blank if a frame doesn't need one:

```yaml
  - src: river-crossing/quiet-street.jpg
    alt: An empty street with shuttered shopfronts before dawn
    caption:
```

A captioned photo uses its caption as the title of its own page; an
uncaptioned one falls back to "Project Name — frame 3". Captions are worth
writing: they're what makes each photograph's page worth finding.

## Editing the home page hero

The hero is one large photograph in the middle of the page that slowly cycles
through a set you choose by hand, with the caption changing underneath it. It
is not tied to the projects list, so you can open with any frames you like, in
any order.

The set lives in the front matter of `src/index.njk`, under `hero:`:

```yaml
hero:
  - src: night-shift/photo-01.jpg
    alt: A crane gantry lit from below against a black sky
    caption: Gantry crane, 2am — Night Shift, Rotterdam
    href: /projects/night-shift/
```

- **`src`** — the photograph, written the same way as anywhere else on the
  site: the folder name, a slash, then the filename.
- **`alt`** — required. The build fails without it. See *Captions and alt
  text* above.
- **`caption`** — the line shown under the photograph while that frame is up.
- **`href`** — optional. Where clicking the photograph goes. Leave it out and
  it goes to the projects index.

Add or remove entries freely; one entry is fine and the hero simply holds
still, with the arrows taken away. The frames change every five seconds and
pause while the pointer is over them, so a visitor can stop on one and look at
it. Arrows either side step through by hand; they appear and disappear with
the header.

**Portrait photographs are welcome.** Every frame is fitted inside the same
box rather than cropped to fill it, so an upright picture is shown whole, with
space either side of it. The flip side is that a picture whose shape differs
from the box has that space rather than filling the screen.

The lines of text below the photograph are in the body of `src/index.njk`:

```njk
<p class="home-hero-statement">I used to make photographs</p>
<p class="home-hero-subtitle">Occasionally, I still do.</p>
```

**The header disappears on the home page.** This is deliberate: the page
opens on the photograph alone, and the name and menu stay out of the way for
the first three seconds and any time the cursor is sitting still. Moving the
mouse — or pressing Tab, or scrolling — brings them back. On phones and
tablets, where there is no cursor to go still, the header behaves normally
and is always there. So does it for anyone browsing with JavaScript turned
off.

**The photograph and its caption always fill the screen exactly**, whatever
size the window is, so the writing below is never half-visible on arrival.
You do not have to do anything to keep that true — but it does mean a very
tall window crops the photograph tall, and a very wide one crops it wide.

Below the hero come the two lines of writing, then every project listed in
order: a picture with its title and details beside it. Add projects and the
list simply grows.

## About, contact and email

- **About** — prose lives in `src/about.md`, below the front matter. Ordinary
  markdown.
- **Contact** — `src/contact.njk`.
- **Email address** — set once, in `src/_data/site.js` (`CONTACT_EMAIL`). It
  is deliberately never written into the published HTML in readable form; see
  below.

## Photograph files: practical notes

- **Size**: supply the largest version you have. The build generates 640,
  1000, 1600 and 2000px-wide copies as needed and never enlarges a photo, so
  a source narrower than 1600px simply won't get the larger sizes. Around
  2000px on the long edge is a good target.
- **Format**: JPEG in, WebP + JPEG out. You don't need to convert anything.
- **Don't optimise them yourself** — the build handles compression.
- The first build after adding photos is slower while it generates the
  variants; they're cached in `.cache/` afterwards.

## Publishing

Committing to `main` and pushing triggers a build and deploy to Bunny.net:

```sh
git add .
git commit -m "Add River Crossing project"
git push
```

> **Not live yet.** The deploy step needs `BUNNY_STORAGE_ZONE` and
> `BUNNY_STORAGE_PASSWORD` set as repository secrets in GitHub. Until those
> exist the build succeeds and the deploy step fails.

---

## For developers

Architecture notes, conventions and gotchas are in [CLAUDE.md](CLAUDE.md).
Briefly:

```
src/
  _data/site.js            site-wide values; the only place the email is set
  _includes/
    layouts/               base, project, about page shells
    partials/              nav, footer, SEO metadata, email link
    macros/ui.njk          the underlined-link-with-chevron button
    shortcodes/image.js    the {% image %} responsive-image shortcode
  projects/                one markdown file per project
  licensing.njk            copyright terms; linked from the footer
  images/                  one folder of photographs per project
  css/style.css            all styling; no inline styles anywhere
  fonts/                   self-hosted Figtree (variable, one file per range)
  js/                      mobile menu, theme toggle, lightbox
  photo.njk                generates a page per photograph
  sitemap.njk              sitemap, including per-photograph image entries
lib/photo.js               shared image config and URL helpers
```

Every generated photograph carries an embedded copyright notice crediting you
and linking back to the site, and each one is published with licensing
metadata so Google Images can show a "Licensable" badge linking to
`/licensing/`. The wording for both lives in one place, `licensing` in
`src/_data/site.js`. Note that changing the
copyright wording does not rebuild images that already exist — delete `_site/`
and build again.

The email address is obfuscated: `src/_data/site.js` exposes only a
character-shifted encoding, and a small inline script in the base layout
decodes it in the browser. No readable address, `@`, or `[at]`-style pattern
appears in the published HTML. `scripts/generate-placeholders.py` regenerates
the stand-in images currently used in place of real photographs.
