from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "store-assets" / "raw"
OUT = ROOT / "store-assets" / "final"
LOGO = ROOT / "src" / "popup" / "quickfill-logo.png"

OUT.mkdir(parents=True, exist_ok=True)

BG = "#F7F2E9"
CARD = "#FFFDF9"
TEXT = "#1E1B18"
MUTED = "#6E645B"
ACCENT = "#D48806"
ACCENT_2 = "#2D2A26"

def font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except Exception:
            continue
    return ImageFont.load_default()

def make_icon():
    base = Image.new("RGB", (128, 128), BG)
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((108, 108))
    x = (128 - logo.width) // 2
    y = (128 - logo.height) // 2
    shadow = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((10, 10, 118, 118), 24, fill=(0, 0, 0, 30))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    base.paste(shadow, (0, 0), shadow)
    card = Image.new("RGBA", (112, 112), (255, 253, 249, 255))
    card_mask = Image.new("L", (112, 112), 0)
    ImageDraw.Draw(card_mask).rounded_rectangle((0, 0, 112, 112), 24, fill=255)
    base.paste(card, (8, 8), card_mask)
    base.paste(logo, (x, y), logo)
    base.save(OUT / "store-icon-128.png")

def compose_screenshot(raw_name, out_name, title, subtitle):
    canvas = Image.new("RGB", (1280, 800), BG)
    draw = ImageDraw.Draw(canvas)
    raw = Image.open(RAW / raw_name).convert("RGB")

    if raw.width < 900:
        framed = Image.new("RGB", (920, 640), "#EFE7DA")
        scaled = raw.resize((raw.width * 2, raw.height * 2), Image.Resampling.LANCZOS)
        sx = (framed.width - scaled.width) // 2
        sy = (framed.height - scaled.height) // 2
        framed.paste(scaled, (sx, sy))
        raw = framed
    else:
        raw = ImageOps.contain(raw, (920, 620))

    card = Image.new("RGB", (980, 680), CARD)
    card_draw = ImageDraw.Draw(card)
    card_draw.rounded_rectangle((0, 0, 979, 679), 28, fill=CARD, outline="#E8DDD0", width=2)

    px = (card.width - raw.width) // 2
    py = 34
    card.paste(raw, (px, py))

    shadow = Image.new("RGBA", (1000, 700), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle((10, 14, 990, 690), 34, fill=(0, 0, 0, 28))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.paste(shadow, (150, 64), shadow)
    canvas.paste(card, (150, 56))

    draw.text((170, 30), title, fill=TEXT, font=font(48, True))
    draw.text((170, 88), subtitle, fill=MUTED, font=font(24))
    draw.text((1020, 742), "@ceorkm", fill=ACCENT_2, font=font(20, True))

    canvas.save(OUT / out_name)

def promo_tile(size, out_name, headline, subline):
    canvas = Image.new("RGB", size, "#F4EEE3")
    draw = ImageDraw.Draw(canvas)
    w, h = size
    draw.rounded_rectangle((0, 0, w - 1, h - 1), 36, fill="#F4EEE3")
    draw.rectangle((0, 0, w, h), fill="#F4EEE3")
    draw.rounded_rectangle((24, 24, w - 24, h - 24), 32, fill="#FFFDF9", outline="#E6D8C8", width=2)

    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((int(h * 0.55), int(h * 0.55)))
    lx = 52
    ly = (h - logo.height) // 2
    canvas.paste(logo, (lx, ly), logo)

    text_x = lx + logo.width + 36
    if w <= 500:
        headline_text = "Fast autofill"
        subline_text = "Profiles, aliases,\nand one-click filling."
        headline_font = font(30, True)
        subline_font = font(16)
        brand_font = font(18, True)
        handle_font = font(14, True)
        draw.text((text_x, 62), headline_text, fill=TEXT, font=headline_font)
        draw.multiline_text((text_x, 114), subline_text, fill=MUTED, font=subline_font, spacing=5)
        draw.text((text_x, 210), "Quickfill", fill=ACCENT, font=brand_font)
        draw.text((w - 110, h - 32), "@ceorkm", fill=ACCENT_2, font=handle_font)
    else:
        draw.text((text_x, h * 0.22), headline, fill=TEXT, font=font(int(h * 0.12), True))
        draw.text((text_x, h * 0.46), subline, fill=MUTED, font=font(int(h * 0.06)))
        draw.text((text_x, h * 0.70), "Quickfill - Form filler", fill=ACCENT, font=font(int(h * 0.07), True))
        draw.text((w - 150, h - 48), "@ceorkm", fill=ACCENT_2, font=font(int(h * 0.05), True))

    canvas.save(OUT / out_name)

make_icon()
compose_screenshot("popup-controls.png", "screenshot-1-controls.png", "Save profiles for faster form fill", "Switch between profiles and trigger autofill in a click.")
compose_screenshot("profile-editor.png", "screenshot-2-editor.png", "Edit detailed profile data", "Manage names, contact details, travel info, addresses, and more.")
compose_screenshot("onboarding.png", "screenshot-3-onboarding.png", "Switch profile modes instantly", "Toggle between saved details and alias-style data when needed.")
promo_tile((440, 280), "small-promo-tile-440x280.png", "Fast browser autofill", "Profiles, aliases, and clean one-click filling.")
promo_tile((1400, 560), "marquee-promo-tile-1400x560.png", "Quickfill", "Form filling made faster for travel, applications, and everyday use.")
