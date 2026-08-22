(function () {
  var galleryEl = document.querySelector("[data-lightbox-gallery]");
  if (!galleryEl) return;

  var dataEl = document.querySelector("[data-lightbox-data]");
  var photos = JSON.parse(dataEl.textContent);
  var lightbox = document.querySelector("[data-lightbox]");
  var content = document.querySelector("[data-lightbox-content]");
  var captionEl = document.querySelector("[data-lightbox-caption]");
  var currentIndex = 0;

  function render(index) {
    currentIndex = (index + photos.length) % photos.length;
    var photo = photos[currentIndex];
    content.textContent = "";
    var img = document.createElement("img");
    img.src = "/images/" + photo.src;
    img.alt = photo.alt;
    img.style.maxWidth = "90vw";
    img.style.maxHeight = "80vh";
    img.style.display = "block";
    content.appendChild(img);
    captionEl.textContent = photo.caption || "";
  }

  function open(index) {
    render(index);
    lightbox.hidden = false;
  }

  function close() {
    lightbox.hidden = true;
  }

  galleryEl.querySelectorAll("[data-lightbox-open]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      open(parseInt(btn.getAttribute("data-index"), 10));
    });
  });

  document.querySelector("[data-lightbox-close]").addEventListener("click", close);
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
  });
})();
