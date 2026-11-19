"""Statyczny podgląd mapy (przybliżenie): kafle + ściany + rozmieszczenie z world-art."""
import re, json
from PIL import Image, ImageDraw
W, H = 2200, 1400
canvas = Image.new('RGBA', (W, H))
def tile(name, x, y, w, h):
    t = Image.open(f'out/tiles/tile-{name}.png').convert('RGBA')
    x0, y0 = int(x - w / 2), int(y - h / 2)
    for ty in range(0, int(h), t.height):
        for tx in range(0, int(w), t.width):
            canvas.alpha_composite(t.crop((0, 0, min(t.width, int(w) - tx), min(t.height, int(h) - ty))), (x0 + tx, y0 + ty))
tile('grass', W/2, H/2, W, H)
tile('asphalt', W/2, 735, W, 240); tile('sidewalk', W/2, 575, W, 80); tile('sidewalk', W/2, 895, W, 80)
d = ImageDraw.Draw(canvas)
for x in range(70, W, 150): d.rectangle([x-41, 731, x+41, 739], fill=(233,196,106))
for x in range(430, 581, 30): d.rectangle([x-9, 735-87, x+9, 735+87], fill=(231,229,223))
tile('parking', 1740, 1015, 700, 190)
for x in range(1480, 2021, 135): d.rectangle([x-2, 935, x+2, 1095], fill=(212,208,200))
B = [(285,285,430,390,'apartment',285,'bottom'),(970,315,360,330,'grocery',970,'bottom'),(1630,315,430,350,'grocery',1630,'bottom'),(780,1170,360,300,'pharmacy',780,'top')]
for x,y,w,h,t,door,side in B:
    tile(t,x,y,w,h)
for x,y,w,h,t,door,side in B:
    l,r,tp,bt=x-w/2,x+w/2,y-h/2,y+h/2; c=(61,64,91)
    d.rectangle([l-12,tp,l+12,bt],fill=c); d.rectangle([r-12,tp,r+12,bt],fill=c)
    wy = bt if side=='bottom' else tp; oy = tp if side=='bottom' else bt
    d.rectangle([l,oy-12,r,oy+12],fill=c)
    d.rectangle([l,wy-12,door-38,wy+12],fill=c); d.rectangle([door+38,wy-12,r,wy+12],fill=c)
for (x,y,w,h,c) in [(275,1210,430,280,(125,133,151)),(1280,1215,480,250,(108,117,125)),(1910,1200,420,280,(141,153,174)),(1085,210,62,110,(255,202,58))]:
    d.rectangle([x-w/2,y-h/2,x+w/2,y+h/2],fill=c+(255,))
ts = open('out/world-art.ts').read()
pl = []
for line in ts.splitlines():
    m = re.search(r'group: "([^"]+)", key: "([^"]+)", x: ([\d.]+), y: ([\d.]+), depth: ([\d.]+)', line)
    if not m: continue
    t = re.search(r'tint: 0x([0-9a-f]+)', line)
    pl.append(dict(key=m[2], x=float(m[3]), y=float(m[4]), depth=float(m[5]), tint=int(t[1], 16) if t else None, flip='flipX: true' in line))
import numpy as np
from PIL import ImageOps
for p in sorted(pl, key=lambda p: p['depth']):
    im = Image.open(f'out/props/{p["key"]}.png').convert('RGBA')
    if p['flip']: im = ImageOps.mirror(im)
    if p['tint']:
        a = np.asarray(im).astype(float); tc = np.array([(p['tint'] >> 16) & 255, (p['tint'] >> 8) & 255, p['tint'] & 255]) / 255
        a[..., :3] *= tc; im = Image.fromarray(a.astype(np.uint8))
    canvas.alpha_composite(im, (int(p['x'] - im.width/2), int(p['y'] - im.height/2)))
# characters for scale (Hubi at spawn, coworker on route)
hubi = Image.open('/home/claude/hubi/out/hubi-spritesheet.png').crop((0,0,64,48))
cw = Image.open('/home/claude/npc/out/coworker-spritesheet.png').crop((0,0,64,48))
canvas.alpha_composite(hubi,(285-32,295-24)); canvas.alpha_composite(cw,(900-32,655-24))
canvas.convert('RGB').save('out/map_preview_full.png')
canvas.crop((0,60,1150,700)).convert('RGB').save('out/map_preview_nw.png')
canvas.crop((1050,60,2200,700)).convert('RGB').save('out/map_preview_ne.png')
canvas.crop((300,820,2200,1400)).convert('RGB').save('out/map_preview_s.png')
print(len(pl))
