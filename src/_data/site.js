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

module.exports = {
  url: "https://danbrady.co.uk",
  title: "Dan Brady — Documentary Photography",
  description:
    "Documentary photography portfolio for Dan Brady, based near Newcastle-upon-Tyne.",
  author: "Dan Brady",
  social: {
    // Deliberately only the encoded form is exposed to templates. Rendering a
    // plain address anywhere would defeat the obfuscation, so there is no
    // plain value available to render by accident.
    emailEncoded: encodeEmail(CONTACT_EMAIL),
  },
};
