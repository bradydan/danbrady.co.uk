const Image = require("@11ty/eleventy-img");
const { PRESETS, imageOptions, inputPath } = require("../../../lib/photo.js");

/**
 * @param {string} src   Path relative to src/images.
 * @param {string} alt   Required alt text.
 * @param {string} caption Optional visible caption.
 * @param {string} preset "cover" or "full".
 * @param {boolean} eager Set for above-the-fold/LCP images so they are not
 *   lazy-loaded, which would delay the largest contentful paint.
 */
async function imageShortcode(src, alt, caption, preset = "full", eager = false) {
  if (!alt) {
    throw new Error(`Missing alt text for image: ${src}`);
  }
  const { sizes } = PRESETS[preset] || PRESETS.full;

  const metadata = await Image(inputPath(src), imageOptions(preset));

  const imageAttributes = {
    alt,
    sizes,
    loading: eager ? "eager" : "lazy",
    decoding: eager ? "sync" : "async",
  };
  if (eager) {
    imageAttributes.fetchpriority = "high";
  }

  const picture = Image.generateHTML(metadata, imageAttributes);
  const figcaption = caption ? `<figcaption>${caption}</figcaption>` : "";
  return `<figure>${picture}${figcaption}</figure>`;
}

module.exports = imageShortcode;
