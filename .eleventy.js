const imageShortcode = require("./src/_includes/shortcodes/image.js");
const { largestJpegUrl, responsiveSources } = require("./lib/photo.js");
const path = require("path");

/** Filename-derived slug for a photo, e.g. "feast-day/photo-01.jpg" -> "photo-01". */
function photoSlug(src) {
  return path.basename(src, path.extname(src));
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addFilter("photoUrl", (src) => largestJpegUrl(src));
  eleventyConfig.addFilter("photoSlug", photoSlug);

  // The lightbox builds its <img> in JS, so it cannot use the image
  // shortcode. This hands it the same generated, responsive files the rest
  // of the site uses instead of the unprocessed original.
  eleventyConfig.addFilter("lightboxPhotos", (photos) =>
    (photos || []).map((photo) => {
      const sources = responsiveSources(photo.src, "full");
      return {
        slug: photoSlug(photo.src),
        alt: photo.alt,
        caption: photo.caption || null,
        src: sources.src,
        srcset: sources.srcset,
        width: sources.width,
        height: sources.height,
      };
    }),
  );
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");

  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/projects/*.md").sort(function (a, b) {
      return a.data.order - b.data.order;
    });
  });

  // One entry per photograph, carrying its project's context plus sibling
  // links, so each photo can be paginated into its own shareable page.
  eleventyConfig.addCollection("photos", function (collectionApi) {
    const projects = collectionApi
      .getFilteredByGlob("src/projects/*.md")
      .sort((a, b) => a.data.order - b.data.order);

    const photos = [];

    for (const project of projects) {
      const list = project.data.photos || [];

      list.forEach((photo, index) => {
        photos.push({
          ...photo,
          slug: photoSlug(photo.src),
          url: `/projects/${project.fileSlug}/${photoSlug(photo.src)}/`,
          date: project.date,
          index,
          position: index + 1,
          total: list.length,
          projectTitle: project.data.title,
          projectSlug: project.fileSlug,
          projectUrl: `/projects/${project.fileSlug}/`,
          projectDescription: project.data.description,
          location: project.data.location,
          year: project.data.year,
          prev: list[index - 1]
            ? {
                slug: photoSlug(list[index - 1].src),
                alt: list[index - 1].alt,
                caption: list[index - 1].caption,
              }
            : null,
          next: list[index + 1]
            ? {
                slug: photoSlug(list[index + 1].src),
                alt: list[index + 1].alt,
                caption: list[index + 1].caption,
              }
            : null,
        });
      });
    }

    return photos;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
