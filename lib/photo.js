"use strict";

const Image = require("@11ty/eleventy-img");
const path = require("path");

const SOURCE_DIR = "src/images";

// Widths shared by every preset that can render at full container width.
// Presets that share a `widths` array share the generated files on disk, so
// varying only `sizes` between them costs nothing extra at build time.
const WIDE_WIDTHS = [640, 1000, 1600, 2000];

/**
 * `sizes` for a home inset occupying `percent` of the 1400px-capped container
 * (`.home-inner`), inside `.home`'s 16px side padding. Mirrors the width
 * rules on `.home-inset:nth-child(...)` in style.css.
 */
function insetPreset(percent) {
  return {
    widths: WIDE_WIDTHS,
    sizes: `(max-width: 900px) 100vw, (max-width: 1432px) ${percent}vw, ${Math.round(
      1400 * (percent / 100),
    )}px`,
  };
}

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

  // Home hero: 1.15fr of a 0.85/1.15 split inside a 1400px container with a
  // 32px gutter each side and a 64px gap, so ~750px once the container caps.
  hero: {
    widths: WIDE_WIDTHS,
    sizes: "(max-width: 900px) 100vw, (max-width: 1432px) 58vw, 750px",
  },

  // Home insets. `.home-inset:nth-child(4n + k)` gives each block a different
  // width, so one shared `sizes` would over-declare for the narrow ones and
  // under-declare for the wide. INSET_PRESETS below maps position to preset.
  inset76: insetPreset(76),
  inset88: insetPreset(88),
  inset70: insetPreset(70),
  inset52: insetPreset(52),

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

// Inset presets in the order `.home-insets` children take them, so the
// template can pick one by position without hard-coding layout widths.
const INSET_PRESETS = ["inset76", "inset88", "inset70", "inset52"];

module.exports = {
  PRESETS,
  INSET_PRESETS,
  SOURCE_DIR,
  imageOptions,
  inputPath,
  largestJpegUrl,
  responsiveSources,
};
