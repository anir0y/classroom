#!/usr/bin/env python3
"""Generate a 1200x630 OG cover card for a TryHackMe room walkthrough.

Matches the house style used across classroom.anir0y.in room posts:
near-black background, a single accent colour, uppercase mono kicker,
oversized title, a row of content cards, the room logo, and a mono footer.

Usage (as a module):
    from gen_room_cover import make_cover
    make_cover(out="static/img/thm-foo/00-thumbnail.png", ...)
"""

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

BG = (18, 18, 18)
CARD_BG = (28, 28, 28)
CARD_BORDER = (48, 44, 40)
WHITE = (242, 242, 242)
GREY = (154, 154, 154)
DIM = (122, 122, 122)

ACCENTS = {
    "orange": (245, 158, 11),
    "teal": (13, 190, 175),
}

HELV = "/System/Library/Fonts/Helvetica.ttc"
MENLO = "/System/Library/Fonts/Menlo.ttc"


def sans(size, bold=True):
    # Helvetica.ttc: index 1 is Bold, 0 is Regular
    return ImageFont.truetype(HELV, size, index=1 if bold else 0)


def mono(size, bold=False):
    # Menlo.ttc: index 0 Regular, 1 Bold
    return ImageFont.truetype(MENLO, size, index=1 if bold else 0)


def text_w(draw, s, font):
    b = draw.textbbox((0, 0), s, font=font)
    return b[2] - b[0]


def make_cover(
    out,
    title_lines,
    subtitle,
    kicker,            # list of segments after "TRYHACKME", e.g. ["SOC LEVEL 2", "ACTIVE DIRECTORY"]
    section_label,
    cards,             # list of (heading, detail) tuples, 3 or 4
    footer_label,
    footer_value,
    logo=None,
    accent="orange",
    arrows=True,
):
    acc = ACCENTS[accent]
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)

    # ---- kicker row -------------------------------------------------
    x, y = 64, 56
    # small accent square glyph
    d.rounded_rectangle([x, y, x + 21, y + 21], radius=5, outline=acc, width=2)
    d.rounded_rectangle([x + 7, y + 7, x + 14, y + 14], radius=2, fill=acc)
    x += 35

    f_kick = mono(17, bold=True)
    d.text((x, y + 3), "TRYHACKME", fill=WHITE, font=f_kick)
    x += text_w(d, "TRYHACKME", f_kick) + 26

    f_kick2 = mono(17)
    for seg in kicker:
        d.text((x, y + 3), "·", fill=(90, 90, 90), font=f_kick2)
        x += 22
        d.text((x, y + 3), seg.upper(), fill=GREY, font=f_kick2)
        x += text_w(d, seg.upper(), f_kick2) + 26

    # ---- room logo (top right) --------------------------------------
    if logo:
        try:
            lg = Image.open(logo).convert("RGBA")
            lg.thumbnail((116, 116), Image.LANCZOS)
            img.paste(lg, (W - 64 - lg.width, 40), lg)
        except Exception as e:  # noqa: BLE001 - cover art is best-effort
            print(f"  ! logo skipped: {e}")

    # ---- title ------------------------------------------------------
    # Two-line titles need a tighter type size and a higher start so the
    # subtitle and card row keep their breathing room on a 630px canvas.
    two_line = len(title_lines) > 1
    t_size, t_start, t_step = (64, 104, 76) if two_line else (72, 118, 82)

    y = t_start
    f_title = sans(t_size)
    for line in title_lines:
        d.text((62, y), line, fill=WHITE, font=f_title)
        y += t_step

    # ---- subtitle ---------------------------------------------------
    y += 16
    f_sub = sans(27, bold=False)
    d.text((64, y), subtitle, fill=GREY, font=f_sub)

    # ---- section label ----------------------------------------------
    y_cards = 368 if two_line else 352
    d.text((64, y_cards - 44), section_label, fill=acc, font=sans(20))

    # ---- cards ------------------------------------------------------
    n = len(cards)
    gap = 40 if arrows else 22
    total_w = W - 128
    cw = (total_w - gap * (n - 1)) // n
    ch = 118
    f_ch = sans(21)
    f_cd = mono(13)

    for i, (heading, detail) in enumerate(cards):
        cx = 64 + i * (cw + gap)
        d.rounded_rectangle(
            [cx, y_cards, cx + cw, y_cards + ch],
            radius=9, fill=CARD_BG, outline=CARD_BORDER, width=1,
        )
        d.text((cx + 24, y_cards + 26), heading, fill=acc, font=f_ch)
        d.text((cx + 24, y_cards + 66), detail, fill=GREY, font=f_cd)

        if arrows and i < n - 1:
            ax = cx + cw + 10
            ay = y_cards + ch // 2
            d.line([(ax, ay), (ax + 19, ay)], fill=acc, width=2)
            d.polygon([(ax + 19, ay - 5), (ax + 26, ay), (ax + 19, ay + 5)], fill=acc)

    # ---- footer -----------------------------------------------------
    fy = y_cards + ch + 44
    d.text((64, fy), footer_label, fill=DIM, font=sans(16, bold=False))
    d.text((64, fy + 26), footer_value, fill=WHITE, font=mono(26, bold=True))

    img.save(out, "PNG", optimize=True)
    print(f"  Created {out} ({W}x{H})")


if __name__ == "__main__":
    print("This module is imported by per-room cover scripts.")
