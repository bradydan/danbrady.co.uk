(function () {
  var menu = document.querySelector("[data-mobile-menu]");
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");
  var themeToggle = document.querySelector("[data-theme-toggle]");
  var themeColor = document.querySelector('meta[name="theme-color"]');

  // Keep the browser chrome in step with the theme. Values mirror --color-bg
  // for each theme in style.css.
  function syncThemeColor(theme) {
    if (themeColor) themeColor.setAttribute("content", theme === "light" ? "#e6e0d4" : "#141416");
  }

  function openMenu() {
    menu.classList.add("is-open");
    openBtn.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    menu.classList.remove("is-open");
    openBtn.setAttribute("aria-expanded", "false");
  }

  if (openBtn) openBtn.addEventListener("click", openMenu);
  if (closeBtn) closeBtn.addEventListener("click", closeMenu);

  // The switch reports its own state. `aria-checked` drives the knob position
  // in the stylesheet too, so there is one fact to keep right, not two.
  function syncThemeToggle(theme) {
    if (!themeToggle) return;
    themeToggle.setAttribute("aria-checked", theme === "light" ? "false" : "true");
    themeToggle.setAttribute("aria-label", theme === "light" ? "Light theme" : "Dark theme");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var html = document.documentElement;
      var current = html.getAttribute("data-theme") === "light" ? "dark" : "light";
      html.setAttribute("data-theme", current);
      syncThemeColor(current);
      syncThemeToggle(current);
      try {
        localStorage.setItem("theme", current);
      } catch (e) {}
    });
  }

  try {
    var saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch (e) {}
  var theme = document.documentElement.getAttribute("data-theme");
  syncThemeColor(theme);
  // The markup ships checked because the document defaults to dark; correct it
  // here in case the blocking script in base.njk restored a saved light theme.
  syncThemeToggle(theme);
})();
