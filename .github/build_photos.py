"""Resize every photo in photos/ for the web and write photos/photos.json.

Caption = file name. "01 Our first trip.jpg" -> "Our first trip".
Photos are shown in file-name order, so start names with 01, 02, ... to set the order.
"""
import base64, io, json, re, sys
from pathlib import Path
from PIL import Image, ImageOps

try:
    from pillow_heif import register_heif_opener
    register_heif_opener()
except Exception:
    pass

site = Path(sys.argv[1])
src_dir = Path("photos")
out_dir = site / "photos" / "web"
out_dir.mkdir(parents=True, exist_ok=True)
EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".gif", ".bmp"}

def natural(p):
    return [int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", p.name)]

def caption(stem):
    c = re.sub(r"^[\d\s._-]+", "", stem)          # drop leading 01-, 2_, etc.
    c = re.sub(r"[_]+", " ", c).strip()
    if re.fullmatch(r"(IMG|DSC|PXL|WhatsApp Image|Screenshot|image|photo)[\w\s.-]*", c, re.I):
        return ""                                  # camera names make bad captions
    if re.search(r"unsplash|pexels|pixabay|freepik", c, re.I):
        return ""                                  # stock-photo download names
    if any(len(t) >= 8 and re.search(r"\d", t) and re.search(r"[A-Za-z]", t) for t in re.split(r"[\s-]+", c)):
        return ""                                  # random ids like mvasDnG41is
    return c.replace("-", " ").strip()

items = []
files = sorted([p for p in src_dir.iterdir() if p.is_file() and p.suffix.lower() in EXTS], key=natural) if src_dir.exists() else []
for n, p in enumerate(files, 1):
    try:
        if p.suffix.lower() == ".gif":
            out = out_dir / f"{n:03d}.gif"
            out.write_bytes(p.read_bytes())
        else:
            im = ImageOps.exif_transpose(Image.open(p)).convert("RGB")
            big = im.copy(); big.thumbnail((820, 820), Image.LANCZOS)
            out = out_dir / f"{n:03d}.jpg"
            big.save(out, "JPEG", quality=70, optimize=True, progressive=True)
            # tiny blurred preview, embedded in photos.json so it shows instantly
            tiny = im.copy(); tiny.thumbnail((28, 28), Image.LANCZOS)
            buf = io.BytesIO(); tiny.save(buf, "JPEG", quality=60)
            blur = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
            items.append({"src": f"photos/web/{out.name}", "caption": caption(p.stem), "blur": blur})
            print(f"ok   {p.name} -> {out.name} ({out.stat().st_size // 1024} KB)")
            continue
        items.append({"src": f"photos/web/{out.name}", "caption": caption(p.stem)})
        print(f"ok   {p.name} -> {out.name}")
    except Exception as e:
        print(f"skip {p.name}: {e}")

(site / "photos" / "photos.json").write_text(json.dumps(items, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{len(items)} photo(s) published")
