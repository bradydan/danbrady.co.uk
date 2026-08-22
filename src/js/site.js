(function () {
  var menu = document.querySelector("[data-mobile-menu]");
  var openBtn = document.querySelector("[data-menu-open]");
  var closeBtn = document.querySelector("[data-menu-close]");
  var themeToggle = document.querySelector("[data-theme-toggle]");

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

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var html = document.documentElement;
      var current = html.getAttribute("data-theme") === "light" ? "dark" : "light";
      html.setAttribute("data-theme", current);
      try {
        localStorage.setItem("theme", current);
      } catch (e) {}
    });
  }

  try {
    var saved = localStorage.getItem("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  } catch (e) {}
})();
