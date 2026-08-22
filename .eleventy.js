const imageShortcode = require("./src/_includes/shortcodes/image.js");
const sitemap = require("@quasibit/eleventy-plugin-sitemap");
const site = require("./src/_data/site.js");
const { largestJpegUrl } = require("./lib/photo.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);
  eleventyConfig.addFilter("photoUrl", (src) => largestJpegUrl(src));
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/robots.txt");

  eleventyConfig.addCollection("projects", function (collectionApi) {
    return collectionApi.getFilteredByGlob("src/projects/*.md").sort(function (a, b) {
      return a.data.order - b.data.order;
    });
  });

  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: site.url,
    },
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
