#!/usr/bin/env python3
"""
Generate Instagram carousel slides for NYC open mics — one or more slides per day.
Usage: python3 generate_open_mic_slides.py
Output: scripts/instagram_slides/  (PNG files)
Data:   scripts/nyc_mics_june2026.csv  (exported from Supabase open_mics_historical)
"""

import csv
import os
import re
from datetime import date, timedelta
from PIL import Image, ImageDraw, ImageFont

# ── Brand colours ─────────────────────────────────────────────────────────────
BG_TOP       = (12,  58, 114)   # #0c3a72  comediq-blue-dark
BG_BOT       = ( 6,  22,  60)   # deeper navy
ACCENT       = (27,  94, 176)   # #1b5eb0  comediq-blue
ACCENT_LIGHT = (71, 133, 209)   # #4785d1  comediq-blue-light
CREAM        = (244, 241, 234)  # #f4f1ea  comediq-cream
WHITE        = (255, 255, 255)
DIM          = (150, 175, 210)  # muted blue-grey
DIVIDER      = ( 38,  72, 138)  # subtle divider

# ── Canvas ────────────────────────────────────────────────────────────────────
W, H         = 1080, 1350       # 4:5 portrait — ideal Instagram carousel
MICS_PER_SLIDE = 20             # max entries per slide before splitting

# ── Fonts ─────────────────────────────────────────────────────────────────────
FONT_DIR  = "/usr/share/fonts/truetype/dejavu"
FONT_BOLD = os.path.join(FONT_DIR, "DejaVuSans-Bold.ttf")
FONT_REG  = os.path.join(FONT_DIR, "DejaVuSans.ttf")

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
        b = int(top_color[2] + t * (bot_color[2] - top_color[2]))
        draw.line([(0, y), (width, y)], fill=(r, g, b))


def time_sort_key(m):
    t = (m.get("start_time") or "").strip()
    if not t:
        return (3, 0)
    nums = re.findall(r"\d+", t)
    if not nums:
        return (2, 0)
    h  = int(nums[0])
    mn = int(nums[1]) if len(nums) > 1 else 0
    pm = "PM" in t.upper()
    if pm and h != 12:
        h += 12
    if not pm and h == 12:
        h = 0
    if h == 0:
        h = 24  # midnight = late-night
    return (0, h * 60 + mn)


def week_occurrence(d: date) -> int:
    return (d.day - 1) // 7 + 1


def mics_for_day(all_mics, target_day, target_date):
    occurrence = week_occurrence(target_date)
    result = []
    for mic in all_mics:
        if mic["day"].strip() != target_day:
            continue
        if mic["active"].strip().lower() != "true":
            continue
        if mic["city"].strip() != "New York":
            continue
        freq = (mic.get("frequency") or "weekly").strip().lower()
        if freq == "weekly":
            result.append(mic)
        elif freq == "bi_weekly" or freq == "biweekly":
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
        else:
            result.append(mic)
    result.sort(key=time_sort_key)
    return result


def truncate(text, font, max_width, draw):
    if draw.textlength(text, font=font) <= max_width:
        return text
    while text and draw.textlength(text + "…", font=font) > max_width:
        text = text[:-1]
    return text + "…"


# ── Slide builders ────────────────────────────────────────────────────────────

def draw_logo_bar(draw, img, logo_img, y_top=36):
    pad = 54
    logo_size = 58
    resized = logo_img.resize((logo_size, logo_size), Image.LANCZOS)
    img.paste(resized, (pad, y_top), mask=resized.split()[3])
    f_brand = load(FONT_BOLD, 29)
    f_sub   = load(FONT_REG,  23)
    draw.text((pad + logo_size + 14, y_top + 6),  "COMEDIQ",         font=f_brand, fill=WHITE)
    draw.text((pad + logo_size + 14, y_top + 38), "NYC OPEN MICS",   font=f_sub,   fill=CREAM)
    line_y = y_top + logo_size + 14
    draw.rectangle([(pad, line_y), (W - pad, line_y + 2)], fill=ACCENT)
    return line_y + 2


def make_day_slide(day_name, full_date, mics, logo_img,
                   part=None, total_parts=None):
    img  = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    vertical_gradient(draw, W, H, BG_TOP, BG_BOT)

    # Subtle dot grid
    for gx in range(0, W, 70):
        for gy in range(0, H, 70):
            draw.ellipse([(gx-1, gy-1), (gx+1, gy+1)], fill=(255, 255, 255, 12))

    pad = 54
    y   = 36

    # Logo / brand bar
    line_y = draw_logo_bar(draw, img, logo_img, y_top=y)
    y = line_y + 26

    # Day name
    f_day  = load(FONT_BOLD, 80)
    f_date = load(FONT_REG,  32)
    draw.text((pad, y), day_name.upper(), font=f_day, fill=WHITE)
    y += 84

    # Date + optional part label
    date_str = full_date
    if part and total_parts and total_parts > 1:
        date_str += f"   •   Part {part} of {total_parts}"
    draw.text((pad, y), date_str, font=f_date, fill=CREAM)
    y += 38

    # Accent rule
    draw.rectangle([(pad, y), (W - pad, y + 3)], fill=ACCENT_LIGHT)
    y += 3 + 24

    # ── Mic rows ──────────────────────────────────────────────────────────────
    avail_h  = H - y - 90   # leave 90 for footer
    n        = len(mics)
    row_h    = max(avail_h // max(n, 1), 52)
    row_h    = min(row_h, 95)

    mic_fs    = max(26, min(38, row_h - 30))
    detail_fs = max(20, min(29, row_h - 42))

    f_mic    = load(FONT_BOLD, mic_fs)
    f_detail = load(FONT_REG,  detail_fs)

    for i, mic in enumerate(mics):
        if y + row_h > H - 80:
            remaining = len(mics) - i
            f_more = load(FONT_REG, 26)
            draw.text((pad, y + 8), f"+ {remaining} more…", font=f_more, fill=DIM)
            break

        name  = (mic.get("open_mic")    or "").strip()
        time  = (mic.get("start_time")  or "").strip()
        venue = (mic.get("venue_name")  or "").strip()

        name_trunc = truncate(name, f_mic, W - pad * 2, draw)
        draw.text((pad, y), name_trunc, font=f_mic, fill=WHITE)
        y += mic_fs + 4

        parts = []
        if time:  parts.append(time)
        if venue: parts.append(venue)
        detail = "  ·  ".join(parts)
        detail_trunc = truncate(detail, f_detail, W - pad * 2, draw)
        draw.text((pad, y), detail_trunc, font=f_detail, fill=ACCENT_LIGHT)
        y += detail_fs + 8

        if i < n - 1:
            draw.rectangle([(pad, y + 4), (W - pad, y + 5)], fill=DIVIDER)
            y += 16

    # Footer
    f_foot   = load(FONT_REG, 26)
    foot_txt = "comediq.com  ·  New York City"
    fw = draw.textlength(foot_txt, font=f_foot)
    draw.text(((W - fw) / 2, H - 66), foot_txt, font=f_foot, fill=DIM)

    return img


def make_cover_slide(week_label, total_mics, logo_img):
    img  = Image.new("RGB", (W, H))
    draw = ImageDraw.Draw(img)
    vertical_gradient(draw, W, H, BG_TOP, (4, 14, 48))

    pad = 54
    cy  = H // 2 - 120

    logo_size = 110
    resized   = logo_img.resize((logo_size, logo_size), Image.LANCZOS)
    logo_x    = (W - logo_size) // 2
    img.paste(resized, (logo_x, cy - logo_size - 16), mask=resized.split()[3])

    f_big   = load(FONT_BOLD, 92)
    f_med   = load(FONT_BOLD, 50)
    f_small = load(FONT_REG,  34)
    f_tiny  = load(FONT_REG,  27)

    title   = "OPEN MICS"
    tw      = draw.textlength(title, font=f_big)
    draw.text(((W - tw) / 2, cy), title, font=f_big, fill=WHITE)

    sub  = "NEW YORK CITY"
    sw   = draw.textlength(sub, font=f_med)
    draw.text(((W - sw) / 2, cy + 100), sub, font=f_med, fill=ACCENT_LIGHT)

    draw.rectangle([(pad * 2, cy + 166), (W - pad * 2, cy + 169)], fill=ACCENT)

    ww = draw.textlength(week_label, font=f_small)
    draw.text(((W - ww) / 2, cy + 186), week_label, font=f_small, fill=CREAM)

    count_txt = f"{total_mics} active mics this week"
    cw = draw.textlength(count_txt, font=f_tiny)
    draw.text(((W - cw) / 2, cy + 232), count_txt, font=f_tiny, fill=DIM)

    swipe = "Swipe for each day  →"
    sxw   = draw.textlength(swipe, font=f_tiny)
    draw.text(((W - sxw) / 2, H - 90), swipe, font=f_tiny, fill=DIM)

    brand = "comediq.com"
    bw    = draw.textlength(brand, font=f_tiny)
    draw.text(((W - bw) / 2, H - 50), brand, font=f_tiny, fill=DIM)

    return img


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path   = os.path.join(script_dir, "nyc_mics_june2026.csv")
    logo_path  = os.path.join(script_dir, "..", "public", "comediq_white.png")
    output_dir = os.path.join(script_dir, "instagram_slides")
    os.makedirs(output_dir, exist_ok=True)

    # Remove old Austin slides
    for f in os.listdir(output_dir):
        os.remove(os.path.join(output_dir, f))

    with open(csv_path, newline="", encoding="utf-8") as f:
        all_mics = list(csv.DictReader(f))

    logo_img = Image.open(logo_path).convert("RGBA")

    week_start   = date(2026, 6, 2)   # Monday June 2
    days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday",
                    "Friday", "Saturday", "Sunday"]

    # Collect all slides (cover first, then per-day chunks)
    all_day_slides = []
    total_mics     = 0

    for i, day_name in enumerate(days_of_week):
        target_date = week_start + timedelta(days=i)
        mics        = mics_for_day(all_mics, day_name, target_date)
        total_mics += len(mics)

        full_date   = target_date.strftime("%B %-d, %Y")
        chunks      = [mics[j:j + MICS_PER_SLIDE]
                       for j in range(0, max(len(mics), 1), MICS_PER_SLIDE)]
        total_parts = len(chunks)

        for part_idx, chunk in enumerate(chunks):
            all_day_slides.append({
                "day":         day_name,
                "full_date":   full_date,
                "mics":        chunk,
                "part":        part_idx + 1,
                "total_parts": total_parts,
                "mic_count":   len(mics),
            })

    # Cover slide
    week_label = "Week of June 2 – 8, 2026"
    cover      = make_cover_slide(week_label, total_mics, logo_img)
    cover_path = os.path.join(output_dir, "00_cover.png")
    cover.save(cover_path)
    print(f"Saved: 00_cover.png")

    # Day slides
    idx = 1
    for s in all_day_slides:
        part_suffix = (f"_part{s['part']}" if s["total_parts"] > 1 else "")
        fname       = f"{idx:02d}_{s['day'].lower()}{part_suffix}.png"
        slide       = make_day_slide(
            s["day"], s["full_date"], s["mics"], logo_img,
            part=s["part"], total_parts=s["total_parts"]
        )
        slide.save(os.path.join(output_dir, fname))
        label = (f" (part {s['part']}/{s['total_parts']})"
                 if s["total_parts"] > 1 else "")
        print(f"Saved: {fname}  —  {len(s['mics'])} mics{label}")
        idx += 1

    print(f"\nDone. {idx} slides total ({total_mics} active NYC mics this week).")


if __name__ == "__main__":
    main()
