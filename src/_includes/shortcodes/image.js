const Image = require("@11ty/eleventy-img");
const path = require("path");

const PRESETS = {
  cover: { widths: [480, 800, 1200], sizes: "(max-width: 900px) 100vw, 50vw" },
  full: { widths: [640, 1000, 1600, 2000], sizes: "(max-width: 900px) 100vw, 1600px" },
};

async function imageShortcode(src, alt, caption, preset = "full") {
  if (!alt) {
    throw new Error(`Missing alt text for image: ${src}`);
  }
  const { widths, sizes } = PRESETS[preset] || PRESETS.full;
  const inputPath = path.join("src/images", src);

  const metadata = await Image(inputPath, {
    widths: [...widths, null],
    formats: ["webp", "jpeg"],
    outputDir: "_site/img/",
    urlPath: "/img/",
    filenameFormat: (id, srcPath, width, format) => {
      const base = path.basename(srcPath, path.extname(srcPath));
      const dir = path.basename(path.dirname(srcPath));
      return `${dir}-${base}-${width}w.${format}`;
    },
  });

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
