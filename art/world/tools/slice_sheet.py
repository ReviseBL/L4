"""Wycina obiekty z arkusza ChatGPT (przezroczyste tło z mgiełką) do osobnych PNG.
Użycie: slice_sheet.py arkusz.png katalog_wyjściowy [dilate=6] [min_area=4000]"""
import sys, json, numpy as np, scipy.ndimage as nd
from PIL import Image, ImageDraw
src, outdir = sys.argv[1], sys.argv[2]
dil = int(sys.argv[3]) if len(sys.argv) > 3 else 6
min_area = int(sys.argv[4]) if len(sys.argv) > 4 else 4000
a = np.array(Image.open(src).convert('RGBA'))
al = a[..., 3].astype(int); al[al <= 40] = 0
a[..., 3] = al; a[al == 0] = 0
solid = al > 0
lab, n = nd.label(nd.binary_dilation(solid, iterations=dil))
objs = []
for i, sl in enumerate(nd.find_objects(lab)):
    m = (lab[sl] == i + 1) & solid[sl]
    if m.sum() < min_area: continue
    objs.append((sl[0].start, sl[0].stop, sl[1].start, sl[1].stop, i + 1, int(m.sum())))
# order: rows (by center y, 150px bands) then x
objs.sort(key=lambda o: (round(((o[0] + o[1]) / 2) / 150), o[2]))
meta = []
preview = Image.new('RGBA', (a.shape[1], a.shape[0]), (52, 62, 58, 255))
preview.alpha_composite(Image.fromarray(a))
d = ImageDraw.Draw(preview)
for k, (y0, y1, x0, x1, li, area) in enumerate(objs):
    crop = a[y0:y1, x0:x1].copy()
    crop[lab[y0:y1, x0:x1] != li] = 0
    Image.fromarray(crop).save(f'{outdir}/{k:02d}.png')
    meta.append(dict(i=k, bbox=[int(x0), int(y0), int(x1), int(y1)], area=area))
    d.rectangle([x0, y0, x1, y1], outline=(255, 60, 60, 255), width=3)
    d.text((x0 + 4, y0 + 4), str(k), fill=(255, 255, 0, 255))
preview.resize((a.shape[1] // 2, a.shape[0] // 2)).save(f'{outdir}/_index.png')
json.dump(meta, open(f'{outdir}/_meta.json', 'w'), indent=1)
print(len(objs), 'objects')
