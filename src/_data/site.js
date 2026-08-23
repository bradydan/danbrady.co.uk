const CONTACT_EMAIL = "info@danbrady.co.uk";

/**
 * Shift each character code by a fixed offset so the address never appears in
 * the built HTML. The hydrator in base.njk reverses this at runtime.
 * If this offset changes, change the matching `- 13` in that hydrator too.
 */
const encodeEmail = (s) =>
  s
    .split("")
    .map((c) => c.charCodeAt(0) + 13)
    .join(",");

const COPYRIGHT_HOLDER = "Dan Brady";

module.exports = {
  url: "https://danbrady.co.uk",
  title: "Dan Brady — Documentary Photography",
  description:
    "Documentary photography portfolio for Dan Brady, based near Newcastle-upon-Tyne.",
  author: "Dan Brady",
  // Image licensing. Google Images shows a "Licensable" badge when a page's
  // ImageObject structured data carries these, which is why every photograph
  // in seo.njk emits them. The same notice is embedded as EXIF in the
  // generated files (see the formatHooks hook in lib/photo.js), so attribution
  // survives the image being downloaded and passed around.
  licensing: {
    copyrightNotice: `© ${COPYRIGHT_HOLDER}. All rights reserved.`,
    creditText: COPYRIGHT_HOLDER,
    // Paths, not URLs: seo.njk makes them absolute, which structured data
    // requires.
    licensePath: "/licensing/",
    acquireLicensePath: "/contact/",
  },

  social: {
    // Deliberately only the encoded form is exposed to templates. Rendering a
    // plain address anywhere would defeat the obfuscation, so there is no
    // plain value available to render by accident.
    emailEncoded: encodeEmail(CONTACT_EMAIL),
  },
};
