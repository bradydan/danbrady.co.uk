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
  title: "Dan Brady — Documentary Photographs",
  // Also the home page's description: index.njk deliberately sets no
  // `description` of its own, so the site root and the site share one.
  description:
    "Documentary photographs by Dan Brady, who worked as a photographer for a decade and lives near Newcastle-upon-Tyne.",
  author: "Dan Brady",
  // Facts about the person, mirrored into the Person schema on /about/.
  // Keep these in step with the biography in about.md — the structured data
  // is the machine-readable version of the same claims.
  person: {
    jobTitle: "Photographer",
    locality: "Whitley Bay",
    region: "Tyne and Wear",
    country: "GB",
    worksFor: "Consilience",
    worksForUrl: "https://consil.co.uk",
  },

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
