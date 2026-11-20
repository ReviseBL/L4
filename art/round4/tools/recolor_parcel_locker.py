"""Recolours the grey parcel locker art to estate-yellow (keeps outlines, screen and keypad).

Usage: python3 recolor_parcel_locker.py <in.png> <out.png>
"""
import colorsys
import sys

import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
a = np.array(Image.open(src).convert('RGBA')).astype(float) / 255
out = a.copy()
for y in range(a.shape[0]):
    for x in range(a.shape[1]):
        r, g, b, alpha = a[y, x]
        if alpha < 0.05:
            continue
        h, s, v = colorsys.rgb_to_hsv(r, g, b)
        if s < 0.22 and 0.28 < v < 0.97:
            out[y, x, :3] = colorsys.hsv_to_rgb(46 / 360, 0.82 if v < 0.85 else 0.55, min(1, 0.35 + v * 0.72))
Image.fromarray((out * 255).astype('uint8')).save(dst)
