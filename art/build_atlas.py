"""Builds the sprite atlas and scene backgrounds from the raw Qwen-Image generations.

Usage (from the repo root):  python art/build_atlas.py

Raw sheets are flat cartoon sprites on a magenta background laid out in a grid (art/manifest.json).
Each sheet is chroma-keyed, split into connected components, grouped by grid cell, trimmed,
downscaled and shelf-packed into one WebP atlas with extruded padding so linear filtering
never samples a neighbour. Frame rectangles go to src/game/render/atlas.json.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "art"
RAW = ART / "raw"
PUBLIC = ROOT / "public" / "assets"
ATLAS_JSON = ROOT / "src" / "game" / "render" / "atlas.json"


def key_magenta(img: Image.Image) -> Image.Image:
    """Alpha from 'magentaness' (min(R, B) - G), then un-mix the background from soft edges."""
    rgb = np.asarray(img.convert("RGB")).astype(np.float32)
    border = np.concatenate([rgb[:4].reshape(-1, 3), rgb[-4:].reshape(-1, 3), rgb[:, :4].reshape(-1, 3), rgb[:, -4:].reshape(-1, 3)])
    bg = np.median(border, axis=0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    magenta = np.minimum(r, b) - g
    bg_m = float(min(bg[0], bg[2]) - bg[1])
    lo, hi = bg_m * 0.25, bg_m * 0.7
    alpha = 1.0 - np.clip((magenta - lo) / max(hi - lo, 1.0), 0.0, 1.0)
    a = alpha[..., None]
    soft = (a > 0.02) & (a < 0.98)
    unmixed = (rgb - (1.0 - a) * bg) / np.maximum(a, 1e-3)
    out_rgb = np.where(soft, np.clip(unmixed, 0, 255), rgb)
    rgba = np.dstack([out_rgb, alpha * 255.0]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def split_cells(rgba: Image.Image, cols: int, rows: int) -> list[Image.Image | None]:
    """Groups opaque connected components by the grid cell holding their centroid."""
    arr = np.asarray(rgba)
    mask = arr[..., 3] > 40
    labels, count = ndimage.label(mask)
    if count == 0:
        return [None] * (cols * rows)
    index = np.arange(1, count + 1)
    sizes = ndimage.sum(mask, labels, index)
    centroids = ndimage.center_of_mass(mask, labels, index)
    slices = ndimage.find_objects(labels)
    h, w = mask.shape
    min_size = mask.size * 0.00004
    boxes: list[list[int] | None] = [None] * (cols * rows)
    keep: list[set[int]] = [set() for _ in range(cols * rows)]
    for i, (size, (cy, cx), sl) in enumerate(zip(sizes, centroids, slices)):
        if size < min_size or sl is None:
            continue
        cell = min(int(cy / h * rows), rows - 1) * cols + min(int(cx / w * cols), cols - 1)
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        box = boxes[cell]
        boxes[cell] = [x0, y0, x1, y1] if box is None else [min(box[0], x0), min(box[1], y0), max(box[2], x1), max(box[3], y1)]
        keep[cell].add(i + 1)
    out: list[Image.Image | None] = []
    for cell, box in enumerate(boxes):
        if box is None:
            out.append(None)
            continue
        x0, y0, x1, y1 = box
        crop = arr[y0:y1, x0:x1].copy()
        # Drop specks from other components that happen to sit inside this box.
        own = np.isin(labels[y0:y1, x0:x1], list(keep[cell]))
        crop[..., 3] = np.where(own | (crop[..., 3] <= 40), crop[..., 3], 0)
        out.append(Image.fromarray(crop, "RGBA"))
    return out


def fit(img: Image.Image, longest: int) -> Image.Image:
    scale = min(1.0, longest / max(img.size))
    if scale >= 1.0:
        return img
    size = (max(1, round(img.width * scale)), max(1, round(img.height * scale)))
    return img.resize(size, Image.LANCZOS)


def extrude(img: Image.Image, pad: int) -> Image.Image:
    arr = np.asarray(img)
    return Image.fromarray(np.pad(arr, ((pad, pad), (pad, pad), (0, 0)), mode="edge"), "RGBA")


def pack(sprites: dict[str, Image.Image], width: int, pad: int):
    order = sorted(sprites, key=lambda n: sprites[n].height, reverse=True)
    x = y = shelf = 0
    rects: dict[str, tuple[int, int, int, int]] = {}
    for name in order:
        w, h = sprites[name].size
        cw, ch = w + pad * 2, h + pad * 2
        if x + cw > width:
            x, y, shelf = 0, y + shelf, 0
        rects[name] = (x + pad, y + pad, w, h)
        x += cw
        shelf = max(shelf, ch)
    height = y + shelf
    height = (height + 3) // 4 * 4
    atlas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    for name, (rx, ry, w, h) in rects.items():
        atlas.paste(extrude(sprites[name], pad), (rx - pad, ry - pad))
    return atlas, rects


def main() -> int:
    manifest = json.loads((ART / "manifest.json").read_text())
    cfg = manifest["atlas"]
    sprites: dict[str, Image.Image] = {}
    missing: list[str] = []
    for sheet in manifest["sheets"]:
        path = RAW / sheet["file"]
        if not path.exists():
            missing.append(sheet["file"])
            continue
        keyed = key_magenta(Image.open(path))
        cells = split_cells(keyed, sheet["cols"], sheet["rows"])
        longest = cfg["longMax"] if sheet.get("long") else cfg["compactMax"]
        for name, cell in zip(sheet["names"], cells):
            if name is None:
                continue
            if cell is None:
                print(f"warning: {sheet['file']} has no sprite for {name}")
                continue
            sprites[name] = fit(cell, longest)
    if missing:
        print("missing raw sheets:", ", ".join(missing))
    if not sprites:
        return 1

    atlas, rects = pack(sprites, cfg["width"], cfg["padding"])
    PUBLIC.mkdir(parents=True, exist_ok=True)
    atlas.save(PUBLIC / "atlas.webp", "WEBP", quality=90, method=6)
    frames = {name: {"x": x, "y": y, "w": w, "h": h} for name, (x, y, w, h) in sorted(rects.items())}
    ATLAS_JSON.write_text(json.dumps({"width": atlas.width, "height": atlas.height, "frames": frames}, indent=2) + "\n")
    print(f"atlas {atlas.width}x{atlas.height}, {len(frames)} frames")

    bg_dir = PUBLIC / "bg"
    bg_dir.mkdir(parents=True, exist_ok=True)
    for raw_name, scene_id in manifest["backgrounds"].items():
        path = RAW / f"{raw_name}.png"
        if not path.exists():
            print(f"missing background {raw_name}")
            continue
        img = Image.open(path).convert("RGB")
        img.save(bg_dir / f"{scene_id}.webp", "WEBP", quality=80, method=6)
        fit(img, 480).save(bg_dir / f"{scene_id}-thumb.webp", "WEBP", quality=78, method=6)
    key_art = RAW / manifest["keyArt"]
    if key_art.exists():
        Image.open(key_art).convert("RGB").save(PUBLIC / "key-art.webp", "WEBP", quality=82, method=6)
    return 0


if __name__ == "__main__":
    sys.exit(main())
