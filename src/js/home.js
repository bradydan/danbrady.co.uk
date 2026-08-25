// Home page behaviour: the cycling hero and the auto-hiding site chrome.
// Both no-op on pages that carry neither the hero markup nor `chrome-auto`.

(function () {
  var CYCLE_MS = 5000;
  var CAPTION_FADE_MS = 400;

  var stage = document.querySelector("[data-hero]");
  if (!stage) return;

  var slides = stage.querySelectorAll("[data-hero-slide]");
  var caption = document.querySelector("[data-hero-caption]");
  if (slides.length < 2) return;

  // With one frame there is nothing to cycle, and someone who has asked for
  // reduced motion should get exactly that: the first frame, held.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var index = 0;
  var timer;
  var captionTimer;

  function advance() {
    var next = (index + 1) % slides.length;
    slides[index].classList.remove("is-active");
    slides[next].classList.add("is-active");
    index = next;

    if (!caption) return;
    caption.classList.add("is-fading");
    clearTimeout(captionTimer);
    captionTimer = setTimeout(function () {
      caption.textContent = slides[next].getAttribute("data-caption") || "";
      caption.classList.remove("is-fading");
    }, CAPTION_FADE_MS);
  }

  function start() {
    stop();
    timer = setInterval(advance, CYCLE_MS);
  }
  function stop() {
    clearInterval(timer);
  }

  // Hovering is someone looking at the frame in front of them; pausing lets
  // them. Focus counts too, so a keyboard visitor tabbing onto the link is
  // not moved off it mid-read.
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
    // Never pull the header out from under a focused link — that is the one
    // case where the visitor is using it without moving a cursor.
    if (header && header.contains(document.activeElement)) return;
    html.classList.add("chrome-hidden");
  }

  function wake() {
    if (locked || touch.matches) return;
    show();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(hide, IDLE_MS);
  }

  // `keydown` and `focusin` are here because a keyboard visitor has no cursor
  // to move; without them the header would be unreachable except through the
  // :focus-within rule in the stylesheet.
  ["mousemove", "wheel", "scroll", "keydown", "focusin"].forEach(function (evt) {
    window.addEventListener(evt, wake, { passive: true });
  });

  // Below the breakpoint there is no cursor, so the header simply stays put.
  function syncBreakpoint() {
    if (touch.matches) {
      clearTimeout(idleTimer);
      show();
    }
  }
  if (touch.addEventListener) touch.addEventListener("change", syncBreakpoint);
  syncBreakpoint();

  // The opening seconds belong to the photograph: movement during them is
  // ignored outright, and afterwards the header still waits to be asked.
  setTimeout(function () {
    locked = false;
  }, LOCK_MS);
})();
