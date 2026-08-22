"use strict";

const { largestJpegUrl } = require("../../lib/photo.js");

/**
 * Adds Google image-sitemap entries for every photo in a project, so each
 * photograph is discoverable through image search even though it has no page
 * of its own. The sitemap plugin spreads `data.sitemap` into the URL entry,
 * and the underlying `sitemap` package renders `img` as <image:image>.
 */
module.exports = {
  eleventyComputed: {
    sitemap: (data) => {
      if (!data.photos || !data.photos.length) {
        return data.sitemap;
      }

      return {
        ...data.sitemap,
        img: data.photos.map((photo) => {
          const entry = {
            url: data.site.url + largestJpegUrl(photo.src),
            title: photo.caption || photo.alt,
          };
          if (photo.caption) {
            entry.caption = photo.caption;
          }
          return entry;
        }),
      };
    },
  },
};
