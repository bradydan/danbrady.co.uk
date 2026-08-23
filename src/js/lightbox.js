(function () {
  var galleryEl = document.querySelector("[data-lightbox-gallery]");
  if (!galleryEl) return;

  var dataEl = document.querySelector("[data-lightbox-data]");
  var photos = JSON.parse(dataEl.textContent);
  var lightbox = document.querySelector("[data-lightbox]");
  var content = document.querySelector("[data-lightbox-content]");
  var captionEl = document.querySelector("[data-lightbox-caption]");
  var permalinkEl = document.querySelector("[data-lightbox-permalink]");
  var triggers = galleryEl.querySelectorAll("[data-lightbox-open]");
  var currentIndex = 0;

  function render(index) {
    currentIndex = (index + photos.length) % photos.length;
    var photo = photos[currentIndex];
    content.textContent = "";
    // photo.src/srcset are the generated, resized files (see the
    // lightboxPhotos filter) — never the unprocessed original.
    var img = document.createElement("img");
    img.className = "lightbox-image";
    img.src = photo.src;
    if (photo.srcset) {
      img.srcset = photo.srcset;
      img.sizes = "90vw";
    }
    if (photo.width) img.width = photo.width;
    if (photo.height) img.height = photo.height;
    img.alt = photo.alt;
    img.decoding = "async";
    content.appendChild(img);

    // Warm the neighbouring frames so arrow-key paging feels instant.
    [currentIndex - 1, currentIndex + 1].forEach(function (i) {
      var neighbour = photos[(i + photos.length) % photos.length];
      if (!neighbour || neighbour === photo) return;
      var pre = new Image();
      if (neighbour.srcset) {
        pre.sizes = "90vw";
        pre.srcset = neighbour.srcset;
      }
      pre.src = neighbour.src;
    });
    captionEl.textContent = photo.caption || "";
    if (permalinkEl && triggers[currentIndex]) {
      permalinkEl.href = triggers[currentIndex].getAttribute("href");
    }
  }

  var lastFocused = null;
  var closeBtn = document.querySelector("[data-lightbox-close]");

  function focusable() {
    return lightbox.querySelectorAll("a[href], button");
  }

  function open(index) {
    lastFocused = document.activeElement;
    render(index);
    lightbox.hidden = false;
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
    if (closeBtn) closeBtn.focus();
  }

  function close() {
    lightbox.hidden = true;
    lightbox.style.display = "none";
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }

  // Keep Tab inside the dialog while it is open.
  function trapTab(e) {
    var items = focusable();
    if (!items.length) return;
    var first = items[0];
    var last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // Clicking the backdrop (but not the image or controls) closes.
  lightbox.addEventListener("click", function (e) {
    if (e.target === lightbox) close();
  });

  // Each trigger is a real link to the photo's own page. Intercept plain
  // left-clicks to show the lightbox instead, but leave modified clicks
  // (new tab/window) and keyboard-driven navigation alone.
  triggers.forEach(function (link) {
    link.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
      open(parseInt(link.getAttribute("data-index"), 10));
    });
  });

  closeBtn.addEventListener("click", close);
  document.querySelector("[data-lightbox-prev]").addEventListener("click", function () {
    render(currentIndex - 1);
  });
  document.querySelector("[data-lightbox-next]").addEventListener("click", function () {
    render(currentIndex + 1);
  });

  document.addEventListener("keydown", function (e) {
    if (lightbox.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") render(currentIndex - 1);
    if (e.key === "ArrowRight") render(currentIndex + 1);
    if (e.key === "Tab") trapTab(e);
  });
})();
