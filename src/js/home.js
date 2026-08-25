// Home page behaviour: the cycling hero and the auto-hiding site chrome.
// Both no-op on pages that carry neither the hero markup nor `chrome-auto`.

(function () {
  var CYCLE_MS = 5000;
  var CAPTION_FADE_MS = 400;

  var stage = document.querySelector("[data-hero]");
  if (!stage) return;

  var slides = stage.querySelectorAll("[data-hero-slide]");
  var caption = document.querySelector("[data-hero-caption]");
  var prev = stage.querySelector("[data-hero-prev]");
  var next = stage.querySelector("[data-hero-next]");

  // With a single frame there is nothing to move between, so the controls
  // would be a lie. Take them out rather than leave them inert.
  if (slides.length < 2) {
    if (prev) prev.remove();
    if (next) next.remove();
    return;
  }

  // Someone who has asked for reduced motion gets no automatic movement — but
  // they still get the controls, so the sequence remains theirs to browse.
  var autoplay = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var index = 0;
  var timer;
  var captionTimer;

  function goTo(target) {
    var n = (target + slides.length) % slides.length;
    if (n === index) return;
    slides[index].classList.remove("is-active");
    slides[n].classList.add("is-active");
    index = n;

    if (!caption) return;
    caption.classList.add("is-fading");
    clearTimeout(captionTimer);
    captionTimer = setTimeout(function () {
      caption.textContent = slides[n].getAttribute("data-caption") || "";
      caption.classList.remove("is-fading");
    }, CAPTION_FADE_MS);
  }

  function start() {
    stop();
    if (autoplay) timer = setInterval(function () { goTo(index + 1); }, CYCLE_MS);
  }
  function stop() {
    clearInterval(timer);
  }

  // Stepping by hand restarts the clock, so a frame just chosen gets its full
  // turn rather than the remainder of the previous one.
  function step(by) {
    return function () {
      goTo(index + by);
      start();
    };
  }
  if (prev) prev.addEventListener("click", step(-1));
  if (next) next.addEventListener("click", step(1));

  // Hovering is someone looking at the frame in front of them; pausing lets
  // them. Focus counts too, so a keyboard visitor tabbing onto the controls is
  // not moved off mid-read.
  stage.addEventListener("mouseenter", stop);
  stage.addEventListener("mouseleave", start);
  stage.addEventListener("focusin", stop);
  stage.addEventListener("focusout", start);

  // A background tab advancing invisibly wastes work and lands the visitor on
  // an arbitrary frame when they return.
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else start();
  });

  start();
})();

(function () {
  var LOCK_MS = 3000;
  var IDLE_MS = 2500;

  var html = document.documentElement;
  if (!html.classList.contains("chrome-auto")) return;

  var header = document.querySelector(".site-header");
  var touch = window.matchMedia("(max-width: 900px)");
  var locked = true;
  var idleTimer;

  function show() {
    html.classList.remove("chrome-hidden");
  }

  function hide() {
    // Never pull the chrome out from under a focused control — that is the one
    // case where the visitor is using it without moving a cursor.
    var active = document.activeElement;
    if (header && header.contains(active)) return;
    if (active && active.closest && active.closest(".home-hero-nav")) return;
    html.classList.add("chrome-hidden");
  }

  function wake() {
    if (locked || touch.matches) return;
    show();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hide, IDLE_MS);
  }

  // `keydown` and `focusin` are here because a keyboard visitor has no cursor
  // to move; without them the chrome would be unreachable except through the
  // focus rules in the stylesheet.
  ["mousemove", "wheel", "scroll", "keydown", "focusin"].forEach(function (evt) {
    window.addEventListener(evt, wake, { passive: true });
  });

  // Below the breakpoint there is no cursor, so the chrome simply stays put.
  function syncBreakpoint() {
    if (touch.matches) {
      clearTimeout(idleTimer);
      show();
    }
  }
  if (touch.addEventListener) touch.addEventListener("change", syncBreakpoint);
  syncBreakpoint();

  // The opening seconds belong to the photograph: movement during them is
  // ignored outright, and afterwards the chrome still waits to be asked.
  setTimeout(function () {
    locked = false;
  }, LOCK_MS);
})();
