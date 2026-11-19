"""Seamless tile downscale: 3x3 wrap → resize → crop center (krawędzie pozostają ciągłe)."""
import sys, numpy as np
from PIL import Image
SIZE = int(sys.argv[1]) if len(sys.argv) > 1 else 192
names = ['grass', 'sidewalk', 'asphalt', 'apartment', 'grocery', 'pharmacy', 'parking']
for n in names:
    im = Image.open(f'src/tile-{n}.png').convert('RGB')
    w, h = im.size
    big = Image.new('RGB', (w * 3, h * 3))
    for i in range(3):
        for j in range(3):
            big.paste(im, (i * w, j * h))
    small = big.resize((SIZE * 3, SIZE * 3), Image.LANCZOS).crop((SIZE, SIZE, SIZE * 2, SIZE * 2))
    small.save(f'out/tiles/tile-{n}.png')
    a = np.asarray(small).astype(int)
    seam_x = np.abs(a[:, 0] - a[:, -1]).mean(); seam_y = np.abs(a[0] - a[-1]).mean()
    inner = np.abs(a[:, 1:] - a[:, :-1]).mean()
    print(f'{n:10s} seam x {seam_x:5.1f}  seam y {seam_y:5.1f}  (typical neighbour diff {inner:4.1f})')
# preview: each tile 2x2
prev = Image.new('RGB', (SIZE * 2 * 4, SIZE * 2 * 2), (0, 0, 0))
for k, n in enumerate(names):
    t = Image.open(f'out/tiles/tile-{n}.png')
    ox, oy = (k % 4) * SIZE * 2, (k // 4) * SIZE * 2
    for i in range(2):
        for j in range(2):
            prev.paste(t, (ox + i * SIZE, oy + j * SIZE))
prev.save('out/tiles/_preview.png')
