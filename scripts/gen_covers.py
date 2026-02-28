#!/usr/bin/env python3
"""Generate cover images for classroom.anir0y.in blog posts.

Outputs to both static/img/ (for direct serving) and assets/img/ (for Hugo resource pipeline).
Designed to complement the Blowfish theme's ocean color scheme.
"""

from PIL import Image, ImageDraw, ImageFont
import math
import random

# Image dimensions: 1200x630 (standard OG image size)
W, H = 1200, 630

# Fonts
MENLO = "/System/Library/Fonts/Menlo.ttc"
SF_BOLD = "/System/Library/Fonts/SFNSMono.ttf"
HELVETICA_BOLD = "/System/Library/Fonts/Helvetica.ttc"

# Fallback font chain
def get_title_font(size):
    for path in [SF_BOLD, HELVETICA_BOLD, MENLO]:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()

def get_mono_font(size):
    for path in [MENLO, SF_BOLD]:
        try:
            return ImageFont.truetype(path, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()

BASE = "/Users/animeshroy/Documents/git/classroom"
OUT_DIRS = [f"{BASE}/static/img", f"{BASE}/assets/img"]


def save_all(img, name, fmt="PNG", **kwargs):
    """Save image to all output directories."""
    for d in OUT_DIRS:
        img.save(f"{d}/{name}", fmt, **kwargs)
    print(f"  Created {name} ({W}x{H})")


def draw_gradient_bg(draw, color_top, color_bot):
    """Draw a smooth vertical gradient background."""
    for y in range(H):
        t = y / H
        r = int(color_top[0] + (color_bot[0] - color_top[0]) * t)
        g = int(color_top[1] + (color_bot[1] - color_top[1]) * t)
        b = int(color_top[2] + (color_bot[2] - color_top[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))


def draw_dots_pattern(draw, color, spacing=50, radius=2, seed=42):
    """Draw a subtle dot grid pattern."""
    random.seed(seed)
    for x in range(spacing // 2, W, spacing):
        for y in range(spacing // 2, H, spacing):
            # Slight random offset for organic feel
            ox = random.randint(-3, 3)
            oy = random.randint(-3, 3)
            draw.ellipse(
                [x + ox - radius, y + oy - radius, x + ox + radius, y + oy + radius],
                fill=color,
            )


def draw_glow_circle(draw, cx, cy, radius, color, steps=20):
    """Draw a soft glowing circle."""
    for i in range(steps, 0, -1):
        t = i / steps
        r = int(radius * t * 1.5)
        alpha = int(color[0] * (1 - t) * 0.3)
        c = (
            min(255, int(color[0] * (1 - t * 0.5))),
            min(255, int(color[1] * (1 - t * 0.5))),
            min(255, int(color[2] * (1 - t * 0.5))),
        )
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)


def draw_center_text(draw, y, text, font, fill):
    """Draw centered text."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((W - tw) // 2, y), text, fill=fill, font=font)


def generate_thm_cover():
    """TryHackMe: deep blue-green gradient with terminal aesthetic."""
    img = Image.new("RGB", (W, H), (10, 15, 25))
    draw = ImageDraw.Draw(img)

    # Gradient: deep navy to dark teal
    draw_gradient_bg(draw, (8, 15, 30), (10, 25, 35))

    # Subtle dot grid
    draw_dots_pattern(draw, (20, 40, 55), spacing=40, radius=1)

    # Decorative circles (soft glow orbs)
    draw_glow_circle(draw, 180, 120, 80, (0, 200, 120))
    draw_glow_circle(draw, 1020, 500, 60, (0, 150, 200))
    draw_glow_circle(draw, 900, 100, 40, (0, 180, 100))

    # Horizontal accent line
    y_line = H // 2 + 80
    for i in range(3):
        a = max(0, 100 - i * 30)
        draw.line([(100, y_line + i), (W - 100, y_line + i)], fill=(0, a, int(a * 0.6)))

    # Terminal prompt line (subtle, top area)
    font_mono = get_mono_font(14)
    draw.text((80, 50), "$ ssh ctf@tryhackme.com", fill=(0, 120, 80), font=font_mono)
    draw.text((80, 72), "$ cat /flag.txt", fill=(0, 100, 70), font=font_mono)

    # Main title
    font_title = get_title_font(64)
    draw_center_text(draw, 200, "TryHackMe", font_title, (255, 255, 255))

    # Subtitle
    font_sub = get_mono_font(30)
    draw_center_text(draw, 285, "Room Walkthrough", font_sub, (0, 220, 130))

    # Divider dots
    dots_y = 340
    for i in range(5):
        dx = W // 2 - 40 + i * 20
        draw.ellipse([dx - 2, dots_y - 2, dx + 2, dots_y + 2], fill=(0, 180, 110))

    # Author/site
    font_sm = get_mono_font(18)
    draw_center_text(draw, 380, "classroom.anir0y.in", font_sm, (80, 130, 160))

    # Bottom accent bar
    for i in range(3):
        draw.line([(0, H - 1 - i), (W, H - 1 - i)], fill=(0, max(0, 180 - i * 50), max(0, 120 - i * 30)))

    save_all(img, "thm.png")


def generate_cover():
    """Generic cybersecurity: ocean gradient with shield icon."""
    img = Image.new("RGB", (W, H), (10, 18, 35))
    draw = ImageDraw.Draw(img)

    # Gradient: deep blue to navy
    draw_gradient_bg(draw, (8, 20, 45), (5, 12, 28))

    # Dot grid
    draw_dots_pattern(draw, (15, 30, 55), spacing=45, radius=1, seed=77)

    # Soft glow orbs
    draw_glow_circle(draw, 200, 500, 100, (0, 100, 200))
    draw_glow_circle(draw, 1000, 150, 70, (0, 120, 220))

    # Shield icon (centered, clean lines)
    cx, cy = W // 2, 220
    size = 70

    # Shield shape
    pts = [
        (cx, cy - size),
        (cx + size * 0.85, cy - size * 0.55),
        (cx + size * 0.85, cy + size * 0.15),
        (cx + size * 0.5, cy + size * 0.7),
        (cx, cy + size),
        (cx - size * 0.5, cy + size * 0.7),
        (cx - size * 0.85, cy + size * 0.15),
        (cx - size * 0.85, cy - size * 0.55),
    ]
    pts = [(int(x), int(y)) for x, y in pts]
    draw.polygon(pts, outline=(0, 160, 240), fill=(10, 30, 60))
    draw.polygon(pts, outline=(0, 160, 240), width=2)

    # Checkmark inside shield
    check_pts = [
        (cx - 18, cy + 5),
        (cx - 5, cy + 22),
        (cx + 22, cy - 15),
    ]
    draw.line(check_pts, fill=(0, 200, 255), width=4, joint="curve")

    # Title
    font_title = get_title_font(56)
    draw_center_text(draw, 340, "Cybersecurity", font_title, (255, 255, 255))

    # Subtitle
    font_sub = get_mono_font(24)
    draw_center_text(draw, 410, "Research  |  Analysis  |  Defense", font_sub, (0, 160, 220))

    # Divider
    draw.line([(W // 2 - 60, 460), (W // 2 + 60, 460)], fill=(0, 120, 180), width=2)

    # Site
    font_sm = get_mono_font(18)
    draw_center_text(draw, 480, "classroom.anir0y.in", font_sm, (70, 120, 170))

    # Bottom accent
    for i in range(3):
        draw.line([(0, H - 1 - i), (W, H - 1 - i)], fill=(0, max(0, 140 - i * 40), max(0, 220 - i * 60)))

    save_all(img, "cover.jpg", "JPEG", quality=92)


def generate_blog_cover():
    """Blog/article: warm purple-blue gradient with code aesthetic."""
    img = Image.new("RGB", (W, H), (15, 12, 25))
    draw = ImageDraw.Draw(img)

    # Gradient: dark purple to deep blue
    draw_gradient_bg(draw, (18, 10, 35), (8, 15, 30))

    # Dot pattern
    draw_dots_pattern(draw, (25, 18, 45), spacing=42, radius=1, seed=123)

    # Glow orbs
    draw_glow_circle(draw, 150, 480, 90, (120, 50, 200))
    draw_glow_circle(draw, 1050, 180, 60, (80, 100, 220))

    # Code bracket decoration (left side)
    font_bracket = get_mono_font(120)
    draw.text((60, 180), "{", fill=(60, 40, 100), font=font_bracket)
    draw.text((1060, 180), "}", fill=(60, 40, 100), font=font_bracket)

    # Floating code snippets (very subtle)
    font_code = get_mono_font(12)
    random.seed(200)
    snippets = [
        "def analyze():", "import hashlib", "for pkt in capture:",
        "# exploit PoC", "class Payload:", "return shell",
        "0xdeadbeef", "chmod +x scan.sh", "nmap -sV target",
    ]
    for snip in snippets:
        sx = random.randint(40, W - 200)
        sy = random.randint(30, H - 40)
        draw.text((sx, sy), snip, fill=(40, 30, 65), font=font_code)

    # Main title
    font_title = get_title_font(58)
    draw_center_text(draw, 200, "Security Research", font_title, (255, 255, 255))

    # Subtitle
    font_sub = get_mono_font(26)
    draw_center_text(draw, 280, "Deep Dive Analysis", font_sub, (160, 130, 220))

    # Decorative dots
    dots_y = 335
    for i in range(7):
        dx = W // 2 - 60 + i * 20
        c = (100 + i * 15, 70 + i * 10, 180 + i * 8)
        draw.ellipse([dx - 2, dots_y - 2, dx + 2, dots_y + 2], fill=c)

    # Author line
    font_author = get_mono_font(20)
    draw_center_text(draw, 370, "Animesh Roy", font_author, (140, 120, 180))

    # Site
    font_sm = get_mono_font(16)
    draw_center_text(draw, 405, "classroom.anir0y.in", font_sm, (90, 80, 140))

    # Bottom accent
    for i in range(3):
        draw.line(
            [(0, H - 1 - i), (W, H - 1 - i)],
            fill=(max(0, 100 - i * 30), 0, max(0, 180 - i * 50)),
        )

    save_all(img, "blog.png")


if __name__ == "__main__":
    print("Generating cover images...")
    generate_thm_cover()
    generate_cover()
    generate_blog_cover()
    print("Done!")
