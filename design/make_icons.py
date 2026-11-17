"""Draws the Dual logo mark (two bars, as in app/src/components/Logo.tsx) into every icon the app and the web build need.
Run from the repo root: python design/make_icons.py   (needs Pillow). Colors are the brand colors from app/src/theme/theme.ts."""
from PIL import Image, ImageDraw

MAROON, WHITE, ORANGE = (110, 16, 35, 255), (255, 255, 255, 255), (242, 140, 56, 255)
OUT = 'app/assets/images/'
SS = 4  # supersampling for smooth edges


def mark(size, scale, bg, ink=WHITE):
    """Square canvas, the two bars centred; `scale` = bar height as a share of the canvas."""
    s = size * SS
    img = Image.new('RGBA', (s, s), bg)
    d = ImageDraw.Draw(img)
    unit = s * scale / 22  # Logo 'lg' is 7 x 22 bars with a gap of 3 and radius 4
    w, h, gap, r = 7 * unit, 22 * unit, 3 * unit, 4 * unit
    x0, y0 = (s - (2 * w + gap)) / 2, (s - h) / 2
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], r, fill=ink)
    d.rounded_rectangle([x0 + w + gap, y0, x0 + 2 * w + gap, y0 + h], r, fill=ORANGE)
    return img.resize((size, size), Image.LANCZOS)


def save(img, name):
    img.save(OUT + name)
    print(name, img.size)


save(mark(1024, 0.46, MAROON), 'icon.png')                 # app icon / iOS home screen (full bleed, iOS rounds it)
save(mark(180, 0.46, MAROON), 'apple-touch-icon.png')
save(mark(192, 0.46, MAROON), 'icon-192.png')
save(mark(512, 0.46, MAROON), 'icon-512.png')
save(mark(512, 0.34, MAROON), 'icon-maskable-512.png')    # extra margin: Android crops maskable icons to a circle
save(mark(48, 0.56, MAROON), 'favicon.png')
save(mark(1024, 0.30, (0, 0, 0, 0)), 'android-icon-foreground.png')  # adaptive icon: bars inside the safe zone
save(Image.new('RGBA', (1024, 1024), MAROON), 'android-icon-background.png')
save(mark(1024, 0.30, (0, 0, 0, 0), ink=WHITE).convert('LA').convert('RGBA'), 'android-icon-monochrome.png')
save(mark(1024, 0.22, (0, 0, 0, 0), ink=(110, 16, 35, 255)), 'splash-icon.png')  # on a white splash
