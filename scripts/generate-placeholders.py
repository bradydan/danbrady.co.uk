#!/usr/bin/env python3
"""One-off generator for local placeholder photos. Not run at build time."""
import os
from PIL import Image, ImageDraw, ImageFont

PROJECTS = {
    "feast-day": 6,
    "night-shift": 6,
    "last-ferry": 5,
    "harvest-week": 5,
    "quiet-hours": 5,
}

BASE = os.path.join(os.path.dirname(__file__), "..", "src", "images")


def make_image(path, label, size=(1600, 1067), color=(40, 40, 44)):
    img = Image.new("RGB", size, color)
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 48)
    except OSError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), label, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((size[0] - w) / 2, (size[1] - h) / 2),
        label,
        fill=(200, 200, 195),
        font=font,
    )
    img.save(path, "JPEG", quality=82)


def main():
    for slug, count in PROJECTS.items():
        folder = os.path.join(BASE, slug)
        os.makedirs(folder, exist_ok=True)
        make_image(os.path.join(folder, "cover.jpg"), f"{slug} — cover")
        for i in range(1, count + 1):
            make_image(
                os.path.join(folder, f"photo-{i:02d}.jpg"),
                f"{slug} — {i:02d}",
            )
    print("Placeholder images generated.")


if __name__ == "__main__":
    main()
