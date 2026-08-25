"use strict";

const Image = require("@11ty/eleventy-img");
const path = require("path");
const site = require("../src/_data/site.js");

const SOURCE_DIR = "src/images";

// Widths shared by every preset that can render at full container width.
// Presets that share a `widths` array share the generated files on disk, so
// varying only `sizes` between them costs nothing extra at build time.
const WIDE_WIDTHS = [640, 1000, 1600, 2000];

/**
 * `sizes` must describe the width the image actually renders at, per layout.
 * Over-declaring makes browsers fetch a file larger than they can show;
 * under-declaring makes them fetch one too small and the photograph looks
 * soft. Each preset below is derived from the CSS that lays it out, so if a
 * layout width changes in style.css, change the matching preset here.
 */
const PRESETS = {
  // 3-up grid on /projects/ (2-up under 1200px, 1-up under 900px).
  cover: {
    widths: [480, 800, 1200],
    sizes: "(max-width: 900px) 100vw, (max-width: 1200px) 50vw, 33vw",
  },

  // Home hero: a single centred stage capped at 1000px inside `.home`'s 16px
  // side padding, so it is `100vw - 32px` until the cap bites at 1032px.
  hero: {
    widths: WIDE_WIDTHS,
    sizes: "(max-width: 1032px) calc(100vw - 32px), 1000px",
  },

  // Home project list thumbnail: a fixed 480px box that becomes a fraction of
  // the row on narrow screens. Widths cover 1x through 3x of the capped size.
  thumb: {
    widths: [480, 960, 1440],
    sizes: "(max-width: 900px) 40vw, 480px",
  },

  // Project gallery: 2-up with a 32px gap inside 32px page padding.
  gallery: {
    widths: WIDE_WIDTHS,
    sizes: "(max-width: 900px) 100vw, calc(50vw - 48px)",
  },

  // Per-photo page: `.photo` is capped at 1100px with 32px padding.
  full: {
    widths: WIDE_WIDTHS,
    sizes: "(max-width: 900px) 100vw, (max-width: 1100px) calc(100vw - 32px), 1036px",
  },
};


/**
 * Embed a copyright notice in every generated file, so attribution survives
 * the image being downloaded and passed around. The strings come from
 * _data/site.js so the EXIF and the structured data cannot drift apart.
 *
 * This runs as an eleventy-img *format hook*, which is the only place the
 * library hands out the sharp instance. Two consequences worth knowing:
 *
 *  - A hook takes over encoding entirely. It has to call `.toFormat()` and
 *    return a Buffer itself, which is why the sharp*Options for the format
 *    are re-applied here rather than left to eleventy-img.
 *  - Supplying `formatHooks` replaces eleventy-img's default object, which
 *    holds its built-in SVG hook. Harmless here — no SVG goes through the
 *    shortcode — but it would matter if one ever did.
 *
 * NOTE: eleventy-img's disk cache is a plain existence check on the output
 * path, and this project's filenameFormat puts no hash in the name, so
 * changing these strings does NOT regenerate images that already exist.
 * Clear _site/img first.
 */
function embedCopyright(sharpInstance, outputFormat, formatOptions) {
  return sharpInstance
    .withExif({
      IFD0: {
        // Each field carries a URL back to the site. XMP's xmpRights:
        // WebStatement is the field actually meant for this, but sharp
        // 0.33 cannot write XMP (withXmp arrived in 0.34, and
        // withMetadata({xmp}) is silently dropped), so the links go in the
        // EXIF fields it can write. These are the three most widely
        // surfaced by image viewers and CMS importers.
        //
        // Two encoding traps, both verified against sharp 0.33:
        //  - EXIF strings are 7-bit ASCII, so sharp transliterates on the
        //    way in: © becomes "(C)" and an em dash becomes "--". Keep the
        //    punctuation plain so that stays tidy.
        //  - libvips represents EXIF values as `value (type info)` and
        //    strips the trailing parenthetical when writing. A "(" in a
        //    value therefore TRUNCATES it silently — never put one in, or
        //    the URL after it vanishes with no error.
        Copyright: `${site.licensing.copyrightNotice} Licensing: ${site.url}${site.licensing.licensePath}`,
        Artist: `${site.author} - ${site.url}`,
        ImageDescription: `Photograph by ${site.author} - ${site.url}`,
      },
    })
    .toFormat(outputFormat, formatOptions)
    .toBuffer();
}

/**
 * Shared eleventy-img options. Both the build-time shortcode and the
 * metadata-only statsSync lookups must use identical options, or the URLs
 * they produce will not match the files actually written to disk.
 */
function imageOptions(preset) {
  const { widths } = PRESETS[preset] || PRESETS.full;
  return {
    widths: [...widths, null],
    // AVIF first: browsers take the first format they support, and it is
    // meaningfully smaller than WebP on photographic content. JPEG stays
    // last as the universal fallback, and is what photoUrl/og:image use
    // since crawlers and social unfurlers are least likely to decode AVIF.
    formats: ["avif", "webp", "jpeg"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    formatHooks: {
      avif: function (sharpInstance) {
        return embedCopyright(sharpInstance, "avif", {});
      },
      webp: function (sharpInstance) {
        return embedCopyright(sharpInstance, "webp", {});
      },
      jpeg: function (sharpInstance) {
        return embedCopyright(sharpInstance, "jpeg", {});
      },
    },
    filenameFormat: (id, srcPath, width, format) => {
      const base = path.basename(srcPath, path.extname(srcPath));
      const dir = path.basename(path.dirname(srcPath));
      return `${dir}-${base}-${width}w.${format}`;
    },
  };
}

function inputPath(src) {
  return path.join(SOURCE_DIR, src);
}

/**
 * URL of the largest generated JPEG for a photo.
 *
 * Derived from eleventy-img's own metadata rather than by reconstructing a
 * filename, so it stays correct when a source image is smaller than the
 * largest configured width (eleventy-img never upscales, so that width's
 * file simply does not exist).
 */
function largestJpegUrl(src, preset = "full") {
  const stats = Image.statsSync(inputPath(src), imageOptions(preset));
  const jpegs = stats.jpeg || [];
  if (!jpegs.length) {
    throw new Error(`No JPEG output computed for image: ${src}`);
  }
  return jpegs[jpegs.length - 1].url;
}


/**
 * Responsive sources for a photo, for consumers that build their own <img>
 * in JavaScript (the lightbox) rather than going through the shortcode.
 * Reads eleventy-img's metadata for the same reason largestJpegUrl does:
 * a source narrower than a configured width has no file at that width.
 */
function responsiveSources(src, preset = "full") {
  const stats = Image.statsSync(inputPath(src), imageOptions(preset));
  const toSrcset = (entries) =>
    (entries || []).map((e) => `${e.url} ${e.width}w`).join(", ");
  const jpegs = stats.jpeg || [];
  if (!jpegs.length) {
    throw new Error(`No JPEG output computed for image: ${src}`);
  }
  const largest = jpegs[jpegs.length - 1];
  return {
    src: largest.url,
    width: largest.width,
    height: largest.height,
    srcset: toSrcset(jpegs),
    sizes: (PRESETS[preset] || PRESETS.full).sizes,
  };
}

module.exports = {
  PRESETS,
  SOURCE_DIR,
  imageOptions,
  inputPath,
  largestJpegUrl,
  responsiveSources,
};
