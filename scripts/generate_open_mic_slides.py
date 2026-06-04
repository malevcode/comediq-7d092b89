#!/usr/bin/env python3
"""Generate Instagram carousel PNG slides for NYC open mics — one slide per day of the week.
Output: scripts/instagram_slides/00_cover.png + 01_monday.png … 07_sunday.png
Data:   scripts/nyc_mics_june2026.csv  (active=true, city=New York)
Week:   June 2–8 2026 (Mon=2 Jun … Sun=8 Jun)
"""

import csv
import os
import re
import shutil
from datetime import date
from PIL import Image, ImageDraw, ImageFont

# ── Colours (matched to Canva design screenshot) ──────────────────────────────
BG_COLOR   = (30,  60, 195)     # vivid Comediq blue
HEADER_BG  = (18,  40, 155)     # darker blue for header band
WHITE      = (255, 255, 255)
OFF_WHITE  = (210, 220, 255)    # venue text, footer
RULE_COLOR = (70,  95, 210)     # column divider + row rules

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE        = os.path.dirname(os.path.abspath(__file__))
CSV_PATH    = os.path.join(BASE, "nyc_mics_june2026.csv")
LOGO_PATH   = os.path.join(BASE, "..", "public", "comediq_white.png")
OUTPUT_DIR  = os.path.join(BASE, "instagram_slides")

FONT_BOLD   = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG    = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

# ── Canvas ────────────────────────────────────────────────────────────────────
W, H = 1080, 1350   # 4:5 portrait Instagram carousel

DAYS        = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
WEEK_DATES  = {
    "Monday":    date(2026, 6, 2),
    "Tuesday":   date(2026, 6, 3),
    "Wednesday": date(2026, 6, 4),
    "Thursday":  date(2026, 6, 5),
    "Friday":    date(2026, 6, 6),
    "Saturday":  date(2026, 6, 7),
    "Sunday":    date(2026, 6, 8),  # 2nd Sunday of June (June 1 was 1st)
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def fnt(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size)


def text_w(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bb = draw.textbbox((0, 0), text, font=font)
    return bb[2] - bb[0]


def centered(draw: ImageDraw.ImageDraw, text: str, y: int, font, color=WHITE):
    tw = text_w(draw, text, font)
    draw.text(((W - tw) // 2, y), text, font=font, fill=color)


def truncate(draw: ImageDraw.ImageDraw, text: str, max_w: int, font: ImageFont.FreeTypeFont) -> str:
    if text_w(draw, text, font) <= max_w:
        return text
    while len(text) > 2 and text_w(draw, text + "…", font) > max_w:
        text = text[:-1]
    return text + "…"


def time_sort_key(t: str) -> int:
    """Ascending sort; early AM (midnight–7:59 AM) sorts after PM = late night."""
    nums = re.findall(r"\d+", t)
    if not nums:
        return 9999
    h  = int(nums[0])
    mn = int(nums[1]) if len(nums) > 1 else 0
    pm = "PM" in t.upper()
    if pm and h != 12:
        h += 12
    if not pm and h == 12:
        h = 0
    if h < 8:          # treat early AM as post-midnight
        h += 24
    return h * 60 + mn


def nth_occurrence(d: date) -> int:
    return (d.day - 1) // 7 + 1


# ── Data loading ─────────────────────────────────────────────────────────────

def load_mics() -> dict:
    by_day: dict = {d: [] for d in DAYS}
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("active", "").strip().lower() != "true":
                continue
            city = row.get("city", "").strip()
            if city not in ("New York", "New York City", "NYC"):
                continue
            day = row.get("day", "").strip()
            if day not in DAYS:
                continue
            freq = row.get("frequency", "weekly").strip().lower()
            nth  = nth_occurrence(WEEK_DATES[day])
            include = (
                freq in ("weekly", "bi_weekly", "biweekly") or
                (freq == "1st_of_month" and nth == 1) or
                (freq == "2nd_of_month" and nth == 2) or
                (freq == "3rd_of_month" and nth == 3) or
                (freq == "4th_of_month" and nth == 4) or
                (freq == "5th_of_month" and nth == 5)
            )
            if include:
                by_day[day].append(row)
    for day in DAYS:
        by_day[day].sort(key=lambda r: time_sort_key(r.get("start_time", "")))
    return by_day


# ── Sparkle texture ────────────────────────────────────────────────────────────

def sparkle(img: Image.Image, seed: int = 0):
    import random
    rng = random.Random(seed)
    draw = ImageDraw.Draw(img)
    for _ in range(350):
        x = rng.randint(0, W - 1)
        y = rng.randint(0, H - 1)
        r = rng.randint(1, 3)
        b = rng.randint(170, 220)
        draw.ellipse([(x - r, y - r), (x + r, y + r)], fill=(b, b + 10, 255))


# ── Header ────────────────────────────────────────────────────────────────────
HEADER_H = 215


def draw_header(draw: ImageDraw.ImageDraw, day_label: str, month: str = "JUNE"):
    draw.rectangle([(0, 0), (W, HEADER_H)], fill=HEADER_BG)
    f1 = fnt(FONT_BOLD, 52)
    f2 = fnt(FONT_BOLD, 108)
    f3 = fnt(FONT_BOLD, 21)
    centered(draw, "COMEDIQ'S",                  8,   f1)
    centered(draw, month,                        55,  f2)
    centered(draw, "2026 weekly OPEN MIC LIST",  172, f3, OFF_WHITE)
    f4 = fnt(FONT_BOLD, 29)
    centered(draw, day_label.upper() + " MICS",  HEADER_H + 7, f4)


# ── Footer ────────────────────────────────────────────────────────────────────

def draw_footer(draw: ImageDraw.ImageDraw, img: Image.Image, month_lc: str = "june"):
    f = fnt(FONT_REG, 17)
    centered(draw, "Easier and more accurate at www.comediq.us", H - 70, f, OFF_WHITE)
    centered(draw, f"* mics resume during {month_lc} (check website for more details)", H - 48, f, OFF_WHITE)
    try:
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo = logo.resize((60, 60), Image.LANCZOS)
        img.paste(logo, (W - 78, H - 78), logo)
    except Exception:
        pass


# ── Mic list (two-column) ─────────────────────────────────────────────────────
LIST_TOP    = 260
LIST_BOTTOM = H - 90
LIST_H      = LIST_BOTTOM - LIST_TOP
COL_GAP     = 20
MARGIN      = 18
COL_W       = (W - 2 * MARGIN - COL_GAP) // 2
COL_L       = MARGIN
COL_R       = MARGIN + COL_W + COL_GAP


def draw_mic_list(draw: ImageDraw.ImageDraw, img: Image.Image, mics: list):
    n = len(mics)
    if n == 0:
        return

    # Auto-size fonts to fit all mics in two columns
    for ms in range(23, 11, -1):
        vs    = max(ms - 4, 9)
        row_h = ms + vs + 5
        rpc   = LIST_H // row_h
        if rpc * 2 >= n:
            break
    else:
        ms, vs = 12, 9
        row_h  = ms + vs + 4
        rpc    = LIST_H // row_h

    fm = fnt(FONT_BOLD, ms)
    fv = fnt(FONT_REG,  vs)
    ft = fnt(FONT_BOLD, ms)

    half = min(rpc, (n + 1) // 2)
    col1 = mics[:half]
    col2 = mics[half: half + rpc]

    # Vertical divider
    div_x = COL_L + COL_W + COL_GAP // 2
    draw.line([(div_x, LIST_TOP), (div_x, LIST_BOTTOM)], fill=RULE_COLOR, width=1)

    for col_mics, cx in ((col1, COL_L), (col2, COL_R)):
        y = LIST_TOP
        for m in col_mics:
            name  = m.get("open_mic", "").strip()
            venue = m.get("venue_name", "").strip()
            time  = m.get("start_time", "").strip()

            tw = text_w(draw, time, ft)
            tx = cx + COL_W - tw

            avail = COL_W - tw - 6
            name  = truncate(draw, name,  avail, fm)
            venue = truncate(draw, venue, COL_W, fv)

            draw.text((cx, y),              name,  font=fm, fill=WHITE)
            draw.text((tx, y),              time,  font=ft, fill=WHITE)
            draw.text((cx + 2, y + ms + 1), venue, font=fv, fill=OFF_WHITE)

            rule_y = y + ms + vs + 3
            draw.line([(cx, rule_y), (cx + COL_W, rule_y)], fill=RULE_COLOR, width=1)
            y += row_h


# ── Cover slide ───────────────────────────────────────────────────────────────

def make_cover(total: int) -> Image.Image:
    img  = Image.new("RGB", (W, H), BG_COLOR)
    sparkle(img, seed=0)
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, 0), (W, HEADER_H)], fill=HEADER_BG)

    f1 = fnt(FONT_BOLD, 52)
    f2 = fnt(FONT_BOLD, 108)
    f3 = fnt(FONT_BOLD, 21)
    centered(draw, "COMEDIQ'S",                  8,   f1)
    centered(draw, "JUNE",                        55,  f2)
    centered(draw, "2026 weekly OPEN MIC LIST",  172, f3, OFF_WHITE)

    f_body  = fnt(FONT_BOLD, 34)
    f_swipe = fnt(FONT_REG,  27)
    centered(draw, f"{total} active mics · New York City", 320, f_body)
    centered(draw, "Swipe for each day →",                 400, f_swipe, OFF_WHITE)

    # Day pills
    f_pill = fnt(FONT_BOLD, 25)
    pills  = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    pill_h = 44
    pill_y = 490
    gap    = 12
    total_pw = sum(text_w(draw, p, f_pill) + 26 for p in pills) + gap * (len(pills) - 1)
    px = (W - total_pw) // 2
    for p in pills:
        pw  = text_w(draw, p, f_pill) + 26
        ptw = text_w(draw, p, f_pill)
        draw.rounded_rectangle([(px, pill_y), (px + pw, pill_y + pill_h)],
                                radius=8, fill=(55, 85, 220), outline=WHITE, width=2)
        draw.text((px + (pw - ptw) // 2, pill_y + 9), p, font=f_pill, fill=WHITE)
        px += pw + gap

    draw_footer(draw, img)
    return img


# ── Day slide ─────────────────────────────────────────────────────────────────

def make_day_slide(day: str, mics: list, seed: int = 1) -> Image.Image:
    img  = Image.new("RGB", (W, H), BG_COLOR)
    sparkle(img, seed=seed)
    draw = ImageDraw.Draw(img)
    draw_header(draw, day)
    draw_mic_list(draw, img, mics)
    draw_footer(draw, img)
    return img


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    print("Loading mics…")
    by_day = load_mics()
    total  = sum(len(v) for v in by_day.values())
    print(f"  {total} mics across all days\n")

    img = make_cover(total)
    img.save(os.path.join(OUTPUT_DIR, "00_cover.png"), "PNG")
    print("  Saved 00_cover.png")

    for i, day in enumerate(DAYS, start=1):
        mics  = by_day[day]
        fname = f"{i:02d}_{day.lower()}.png"
        img   = make_day_slide(day, mics, seed=i * 13)
        img.save(os.path.join(OUTPUT_DIR, fname), "PNG")
        print(f"  Saved {fname} — {len(mics)} mics")

    print(f"\nDone — {len(DAYS) + 1} slides in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
