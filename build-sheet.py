"""Slice clawd-final.png into a normalised sprite sheet for renderer/clawd-sheet.png.

Source rows (frame counts in ROW_FRAMES) are laid out on a 192x208 grid with a
lot of slack around each pose. Every cell is cropped to the union bounding box of
all poses -- that keeps the frames aligned with each other -- then scaled down to
the size the pet is actually drawn at, squashed vertically by SQUASH_Y. Row 11 is generated: the droop row tinted
red for the fail state, since a CSS filter cannot hit that colour cleanly.
"""

from PIL import Image
import numpy as np
import colorsys

SRC = 'clawd-final.png'
DST = 'renderer/clawd-sheet.png'

CELL_W, CELL_H = 192, 208
BOX = (4, 4, 184, 180)  # x, y, w, h -- union bbox of every pose plus 2px padding
SCALE = 0.5
SQUASH_Y = 0.85  # squat the pet down a little; 1.0 keeps the source proportions
ROW_FRAMES = [6, 8, 8, 4, 5, 8, 6, 6, 6, 8, 8]
DROOP_ROW = 9

FAIL_HUE = 4 / 360.0
FAIL_SAT = 0.80
FAIL_VAL = 0.86


def tint_fail(img):
    """Recolour the body to red, leaving the near-grey laptop and eyes alone."""
    a = np.array(img).astype(np.int16)
    rgb = a[..., :3]
    hi, lo = rgb.max(axis=2), rgb.min(axis=2)
    body = (hi - lo) > 40
    for y, x in zip(*np.where(body)):
        r, g, b = rgb[y, x] / 255.0
        _, _, v = colorsys.rgb_to_hsv(r, g, b)
        nr, ng, nb = colorsys.hsv_to_rgb(FAIL_HUE, FAIL_SAT, v * FAIL_VAL)
        a[y, x, :3] = [round(nr * 255), round(ng * 255), round(nb * 255)]
    return Image.fromarray(a.astype(np.uint8), 'RGBA')


def main():
    src = Image.open(SRC).convert('RGBA')
    bx, by, bw, bh = BOX
    fw, fh = int(bw * SCALE), int(bh * SCALE * SQUASH_Y)
    rows = len(ROW_FRAMES) + 1  # + generated fail row
    sheet = Image.new('RGBA', (8 * fw, rows * fh), (0, 0, 0, 0))

    for row, count in enumerate(ROW_FRAMES):
        for col in range(count):
            cell = src.crop((col * CELL_W + bx, row * CELL_H + by,
                             col * CELL_W + bx + bw, row * CELL_H + by + bh))
            cell = cell.resize((fw, fh), Image.LANCZOS)
            sheet.paste(cell, (col * fw, row * fh))
            if row == DROOP_ROW:
                sheet.paste(tint_fail(cell), (col * fw, len(ROW_FRAMES) * fh))

    sheet.quantize(colors=96, method=Image.FASTOCTREE).save(DST, optimize=True)
    print(f'frame {fw}x{fh}, sheet {sheet.size}, rows {rows}')


if __name__ == '__main__':
    main()
