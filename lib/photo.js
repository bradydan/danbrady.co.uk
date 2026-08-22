"use strict";

const Image = require("@11ty/eleventy-img");
const path = require("path");

const SOURCE_DIR = "src/images";

const PRESETS = {
  cover: { widths: [480, 800, 1200], sizes: "(max-width: 900px) 100vw, 50vw" },
  full: {
    widths: [640, 1000, 1600, 2000],
    sizes: "(max-width: 900px) 100vw, 1600px",
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
    formats: ["webp", "jpeg"],
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

module.exports = {
  PRESETS,
  SOURCE_DIR,
  imageOptions,
  inputPath,
  largestJpegUrl,
};
