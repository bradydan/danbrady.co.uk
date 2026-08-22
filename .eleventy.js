const imageShortcode = require("./src/_includes/shortcodes/image.js");

module.exports = function (eleventyConfig) {
  eleventyConfig.addNunjucksAsyncShortcode("image", imageShortcode);

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
  };
};
