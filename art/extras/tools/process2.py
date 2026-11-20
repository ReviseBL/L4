import os
import numpy as np
from PIL import Image
from slice import components, resize, fit_h, fit_w
U = '/mnt/user-data/uploads/'
OUT = '/mnt/user-data/outputs/batch2/'
os.makedirs(OUT, exist_ok=True)
def load(f): return Image.open(U + f + '-image.png').convert('RGBA')
def char(img): return fit_h(fit_h(img, 92), 46)

# Grażyna: hazy background -> hard alpha.
g = load('f7fef6cf')
arr = np.array(g); arr[..., 3] = np.where(arr[..., 3] >= 200, 255, 0); g = Image.fromarray(arr)
boxes = components(g, thr=180, dilate=6)
char(g.crop(boxes[0])).save(OUT + 'npc-neighbor-grazyna.png')
char(g.crop(boxes[3])).save(OUT + 'npc-neighbor-grazyna-side.png')

p = load('94d7c84e')
boxes = components(p, dilate=10)
char(p.crop(boxes[1])).save(OUT + 'npc-pharmacist.png')        # back view: she faces the customers
char(p.crop(boxes[0])).save(OUT + 'npc-pharmacist-front.png')

c = load('ab998d50')
char(c.crop(components(c, dilate=10)[0])).save(OUT + 'npc-cashier.png')

k = load('3d1a65f2')
fit_w(k.crop(components(k, dilate=10)[0]), 150).save(OUT + 'world-kebab-kiosk-v2.png')

s = load('e9a19b98')
b = components(s, thr=60, dilate=2, min_area=2000)
names = {0: ('shop-checkout', 'w', 120), 1: ('shop-news-shelf', 'w', 110), 2: ('shop-crates', 'h', 50),
         3: ('shop-fridge', 'h', 80), 4: ('shop-baskets', 'h', 46), 5: ('shop-bread-shelf', 'h', 72), 6: ('shop-freezer', 'w', 72)}
for i, (name, mode, size) in names.items():
    crop = s.crop(b[i])
    img = fit_w(crop, size) if mode == 'w' else fit_h(crop, size)
    img.save(OUT + name + '.png')
for f in sorted(os.listdir(OUT)):
    print(f, Image.open(OUT + f).size)
