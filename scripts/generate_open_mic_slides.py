#!/usr/bin/env python3
"""
Generate Instagram carousel slides for Austin open mics — one slide per day.
Usage: python3 generate_open_mic_slides.py
Output: scripts/instagram_slides/  (one PNG per day + a cover slide)
"""

import csv
import os
from datetime import date, timedelta
from PIL import Image, ImageDraw, ImageFont

# ── Brand colours ────────────────────────────────────────────────────────────
BG_TOP       = (12,  58, 114)   # #0c3a72  comediq-blue-dark
BG_BOT       = ( 8,  28,  72)   # #081c48  deeper navy
ACCENT       = (27,  94, 176)   # #1b5eb0  comediq-blue
ACCENT_LIGHT = (71, 133, 209)   # #4785d1  comediq-blue-light
CREAM        = (244, 241, 234)  # #f4f1ea  comediq-cream
WHITE        = (255, 255, 255)
DIM          = (150, 175, 210)  # muted blue-grey for venue text
DIVIDER      = ( 40,  75, 140)  # subtle divider line
COVER_BG_TOP = (12,  58, 114)
COVER_BG_BOT = ( 5,  18,  55)

# ── Canvas ────────────────────────────────────────────────────────────────────
W, H = 1080, 1350   # 4:5 portrait — ideal Instagram carousel ratio

# ── Fonts ─────────────────────────────────────────────────────────────────────
FONT_DIR = "/usr/share/fonts/truetype/dejavu"
FONT_BOLD   = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
FONT_NORMAL = os.path.join(FONT_DIR, "DejaVuSans.ttf")

def load(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

# ── Helpers ───────────────────────────────────────────────────────────────────

def vertical_gradient(draw, width, height, top_color, bot_color):
    for y in range(height):
        t = y / height
        r = int(top_color[0] + t * (bot_color[0] - top_color[0]))
        g = int(top_color[1] + t * (bot_color[1] - top_color[1]))
        b = int(top_color[2] + t * (bot_color[2] - bot_color[2]))
        b = int(top_color[2] + t * (bot_color[2] - top_color[2]))
        draw.line([(0, y), (width, y)], fill=(r, g, b))


def week_occurrence(d: date) -> int:
    """Return which occurrence of this weekday it is in the month (1-based)."""
    return (d.day - 1) // 7 + 1


def mics_for_day(all_mics: list[dict], target_day: str, target_date: date) -> list[dict]:
    """Filter CSV rows to only active mics that run on this specific date."""
    day_map = {
        "Monday": 0, "Tuesday": 1, "Wednesday": 2, "Thursday": 3,
        "Friday": 4, "Saturday": 5, "Sunday": 6,
    }
    result = []
    occurrence = week_occurrence(target_date)

    for mic in all_mics:
        if mic["day"].strip() != target_day:
            continue
        if mic["active"].strip().lower() != "true":
            continue

        freq = mic.get("frequency", "weekly").strip().lower()

        if freq == "weekly":
            result.append(mic)
        elif freq == "bi_weekly":
            # Include but note it — hard to know exact weeks without more history
            result.append(mic)
        elif freq == "1st_of_month":
            if occurrence == 1:
                result.append(mic)
        elif freq == "2nd_of_month":
            if occurrence == 2:
                result.append(mic)
        elif freq == "3rd_of_month":
            if occurrence == 3:
                result.append(mic)
        elif freq == "4th_of_month":
            if occurrence == 4:
                result.append(mic)
        elif freq == "one_off":
            # Only include if there's no explicit exclusion; add as-is
            result.append(mic)
        # Skip anything else (e.g. hiatus handled by active=false)

    # Sort by start time
    def sort_key(m):
        t = m.get("start_time", "").strip()
        if not t:
            return (3, 0)   # no time → end of list
        try:
            import re
            nums = re.findall(r"\d+", t)
            h, mn = int(nums[0]), (int(nums[1]) if len(nums) > 1 else 0)
            am_pm = "PM" in t.upper()
            if am_pm and h != 12:
                h += 12
            if not am_pm and h == 12:
                h = 0
            # Treat midnight (12 AM) as late-night, sort after PM
            if "12:00 AM" in t or h == 0:
                h = 24
            return (0, h * 60 + mn)
        except Exception:
            return (2, 0)
    result.sort(key=sort_key)
    return result


def truncate(text: str, font, max_width: int, draw) -> str:
    """Truncate text with ellipsis to fit within max_width."""
    if draw.textlength(text, font=font) <= max_width:
        return text
    while text and draw.textlength(text + "…", font=font) > max_width:
        text = text[:-1]
    return text + "…"


# ── Slide builders ────────────────────────────────────────────────────────────

def draw_logo_bar(draw, img, logo_img, y_top=40):
    """Draw the Comediq logo + 'AUSTIN OPEN MICS' header."""
    pad = 60
    logo_size = 64
    logo_resized = logo_img.resize((logo_size, logo_size), Image.LANCZOS)
    img.paste(logo_resized, (pad, y_top), mask=logo_resized.split()[3])

    f_brand = load(FONT_BOLD, 32)
    draw.text((pad + logo_size + 16, y_top + 8), "COMEDIQ", font=f_brand, fill=WHITE)
    f_sub = load(FONT_NORMAL, 26)
    draw.text((pad + logo_size + 16, y_top + 44), "AUSTIN OPEN MICS", font=f_sub, fill=CREAM)

    # Thin accent line under header
    draw.rectangle([(pad, y_top + logo_size + 16), (W - pad, y_top + logo_size + 18)],
                   fill=ACCENT)


def make_day_slide(day_name: str, full_date: str, mics: list[dict], logo_img) -> Image.Image:
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    vertical_gradient(draw, W, H, BG_TOP, BG_BOT)

    # subtle dot pattern overlay
    for gx in range(0, W, 60):
        for gy in range(0, H, 60):
            draw.ellipse([(gx - 1, gy - 1), (gx + 1, gy + 1)],
                         fill=(255, 255, 255, 15))

    pad = 60
    y = 40

    # Logo / branding bar
    draw_logo_bar(draw, img, logo_img, y_top=y)
    y += 64 + 28   # logo height + gap below accent line

    # Day name (large)
    f_day = load(FONT_BOLD, 88)
    draw.text((pad, y), day_name.upper(), font=f_day, fill=WHITE)
    day_w = draw.textlength(day_name.upper(), font=f_day)
    y += 88 + 4

    # Date line
    f_date = load(FONT_NORMAL, 36)
    draw.text((pad, y), full_date, font=f_date, fill=CREAM)
    y += 36 + 28

    # Accent line below date
    draw.rectangle([(pad, y), (W - pad, y + 3)], fill=ACCENT_LIGHT)
    y += 3 + 32

    if not mics:
        f_empty = load(FONT_NORMAL, 38)
        draw.text((pad, y), "No mics listed for this day.", font=f_empty, fill=DIM)
    else:
        # Determine row height based on number of mics
        avail_h = H - y - 100  # leave 100px for footer
        max_rows = min(len(mics), 12)
        row_h = max(avail_h // max_rows, 68)
        row_h = min(row_h, 115)

        mic_font_size = max(30, min(44, row_h - 36))
        detail_font_size = max(24, min(34, row_h - 46))

        f_mic   = load(FONT_BOLD,   mic_font_size)
        f_detail = load(FONT_NORMAL, detail_font_size)

        for i, mic in enumerate(mics):
            if y + row_h > H - 90:
                # Show a "+N more" line if we ran out of space
                remaining = len(mics) - i
                f_more = load(FONT_NORMAL, 30)
                draw.text((pad, y + 10), f"+ {remaining} more mic{'s' if remaining > 1 else ''}",
                          font=f_more, fill=DIM)
                break

            name  = mic.get("open_mic", "").strip()
            time  = mic.get("start_time", "").strip()
            venue = mic.get("venue_name", "").strip()

            # Mic name
            name_trunc = truncate(name, f_mic, W - pad * 2, draw)
            draw.text((pad, y), name_trunc, font=f_mic, fill=WHITE)
            y += mic_font_size + 6

            # Time badge + venue
            detail_parts = []
            if time:
                detail_parts.append(time)
            if venue:
                detail_parts.append(venue)
            detail = "  ·  ".join(detail_parts)
            detail_trunc = truncate(detail, f_detail, W - pad * 2, draw)
            draw.text((pad, y), detail_trunc, font=f_detail, fill=ACCENT_LIGHT)
            y += detail_font_size + 10

            # Divider (skip after last)
            if i < len(mics) - 1:
                div_y = y + 6
                draw.rectangle([(pad, div_y), (W - pad, div_y + 1)], fill=DIVIDER)
                y = div_y + 18

    # Footer
    f_foot = load(FONT_NORMAL, 28)
    footer_text = "comediq.com  ·  🎤  Austin, TX"
    foot_w = draw.textlength(footer_text, font=f_foot)
    draw.text(((W - foot_w) / 2, H - 70), footer_text, font=f_foot, fill=DIM)

    return img


def make_cover_slide(week_label: str, logo_img) -> Image.Image:
    img = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    vertical_gradient(draw, W, H, COVER_BG_TOP, COVER_BG_BOT)

    pad = 60
    # Centred content
    centre_y = H // 2 - 100

    # Large logo
    logo_size = 120
    logo_resized = logo_img.resize((logo_size, logo_size), Image.LANCZOS)
    logo_x = (W - logo_size) // 2
    img.paste(logo_resized, (logo_x, centre_y - logo_size - 20), mask=logo_resized.split()[3])

    f_big   = load(FONT_BOLD, 96)
    f_med   = load(FONT_BOLD, 54)
    f_small = load(FONT_NORMAL, 38)

    title = "OPEN MICS"
    title_w = draw.textlength(title, font=f_big)
    draw.text(((W - title_w) / 2, centre_y), title, font=f_big, fill=WHITE)

    sub = "AUSTIN, TX"
    sub_w = draw.textlength(sub, font=f_med)
    draw.text(((W - sub_w) / 2, centre_y + 105), sub, font=f_med, fill=ACCENT_LIGHT)

    draw.rectangle([(pad * 2, centre_y + 175), (W - pad * 2, centre_y + 178)], fill=ACCENT)

    week_w = draw.textlength(week_label, font=f_small)
    draw.text(((W - week_w) / 2, centre_y + 196), week_label, font=f_small, fill=CREAM)

    # Footer
    f_foot = load(FONT_NORMAL, 28)
    footer = "Swipe for each day →"
    foot_w = draw.textlength(footer, font=f_foot)
    draw.text(((W - foot_w) / 2, H - 80), footer, font=f_foot, fill=DIM)

    f_brand = load(FONT_NORMAL, 26)
    brand = "comediq.com"
    brand_w = draw.textlength(brand, font=f_brand)
    draw.text(((W - brand_w) / 2, H - 44), brand, font=f_brand, fill=DIM)

    return img


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    script_dir   = os.path.dirname(os.path.abspath(__file__))
    csv_path     = os.path.join(script_dir, "austin_mics.csv")
    logo_path    = os.path.join(script_dir, "..", "public", "comediq_white.png")
    output_dir   = os.path.join(script_dir, "instagram_slides")
    os.makedirs(output_dir, exist_ok=True)

    # Load CSV
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        all_mics = list(reader)

    # Load logo
    logo_img = Image.open(logo_path).convert("RGBA")

    # Week: June 2–8, 2026  (Monday = June 2, as today is June 2)
    week_start = date(2026, 6, 2)   # Monday
    days_of_week = [
        "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
    ]

    # Cover slide
    week_label = f"Week of June 2 – 8, 2026"
    cover = make_cover_slide(week_label, logo_img)
    cover_path = os.path.join(output_dir, "00_cover.png")
    cover.save(cover_path)
    print(f"Saved: {cover_path}")

    # One slide per day
    for i, day_name in enumerate(days_of_week):
        target_date = week_start + timedelta(days=i)
        mics = mics_for_day(all_mics, day_name, target_date)

        month_name = target_date.strftime("%B")
        full_date = f"{month_name} {target_date.day}, 2026"

        slide = make_day_slide(day_name, full_date, mics, logo_img)
        out_name = f"0{i+1}_{day_name.lower()}.png"
        out_path = os.path.join(output_dir, out_name)
        slide.save(out_path)
        print(f"Saved: {out_path}  ({len(mics)} mics)")


if __name__ == "__main__":
    main()
