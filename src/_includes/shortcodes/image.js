const Image = require("@11ty/eleventy-img");
const { PRESETS, imageOptions, inputPath } = require("../../../lib/photo.js");

async function imageShortcode(src, alt, caption, preset = "full") {
  if (!alt) {
    throw new Error(`Missing alt text for image: ${src}`);
  }
  const { sizes } = PRESETS[preset] || PRESETS.full;

  const metadata = await Image(inputPath(src), imageOptions(preset));

  const imageAttributes = {
    alt,
    sizes,
    loading: "lazy",
    decoding: "async",
  };

  const picture = Image.generateHTML(metadata, imageAttributes);
  const figcaption = caption ? `<figcaption>${caption}</figcaption>` : "";
  return `<figure>${picture}${figcaption}</figure>`;
}

module.exports = imageShortcode;
