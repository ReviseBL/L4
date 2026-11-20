import os, json
from PIL import Image, ImageDraw, ImageOps
from slice import components, resize, fit_h, fit_w
U = '/mnt/user-data/uploads/'
OUT = '/mnt/user-data/outputs/mg/'
os.makedirs(OUT, exist_ok=True)
def load(f): return Image.open(U + f + '-image.png').convert('RGBA')
meta = {}

# Extruder: hide the bowden tube, open the collet, crop below it.
ext = load('32f5f837')
d = ImageDraw.Draw(ext)
d.ellipse((818, 198, 872, 216), fill=(18, 18, 22, 255))
ext = ext.crop((380, 185, 1300, 941))
s = 151 / ext.height
ext = resize(ext, (round(ext.width * s), 151))
ext.save(OUT + 'mg-extruder.png'); meta['extruder'] = {'hole': [round((845 - 380) * s), round((207 - 185) * s)], 'size': ext.size}

hot = load('5c4c2749')
hs = hot.crop((380, 0, 1300, 941))
s = 152 / hs.height
small = resize(hs, (round(hs.width * s), 152))
small.save(OUT + 'mg-hotend.png'); meta['hotend'] = {'hole': [round((835 - 380) * s), round(50 * s)], 'size': small.size}
s2 = 230 / hs.height
large = resize(hs, (round(hs.width * s2), 230))
large.save(OUT + 'mg-hotend-large.png'); meta['hotendLarge'] = {'nozzle': [round((835 - 380) * s2), round(785 * s2)], 'size': large.size}

hands = load('1b8a50b1')
s = 100 / 791
for name, box, pinch in [('mg-hand', (158, 82, 796, 873), (775, 185)), ('mg-hand-tense', (934, 96, 1546, 873), (1515, 225))]:
    crop = hands.crop(box)
    img = resize(crop, (round(crop.width * s), round(crop.height * s)))
    img = ImageOps.flip(img)
    px = (pinch[0] - box[0]) * s; py = img.height - (pinch[1] - box[1]) * s
    img.save(OUT + name + '.png'); meta[name] = {'origin': [round(px / img.width, 3), round(py / img.height, 3)], 'size': img.size}

snap = load('3e73f7f8')
third = snap.width // 3
s = 0.13
for i in range(3):
    region = snap.crop((i * third, 0, (i + 1) * third, snap.height))
    bbox = region.getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
    frame = region.crop(bbox)
    frame = resize(frame, (max(1, round(frame.width * s)), max(1, round(frame.height * s))))
    frame.save(OUT + f'mg-snap-{i}.png')

fumes = load('2404f344')
for i, box in enumerate(components(fumes, dilate=12)):
    puff = fumes.crop(box)
    puff = resize(puff, (round(puff.width * 0.13), round(puff.height * 0.13)))
    puff.save(OUT + f'mg-fumes-{i}.png')

wrench = load('410397fc')
box = components(wrench, dilate=12)[0]
w = wrench.crop(box)
w = fit_w(w, 150)
w.save(OUT + 'mg-wrench.png'); meta['wrench'] = {'origin': [round((290 - box[0]) * 150 / (box[2] - box[0]) / 150, 3), 0.5], 'size': w.size}

bed = load('d046105a')
boxes = components(bed, dilate=12)
plate = bed.crop((0, 0, 1375, 941))
s = 230 / 941
plate = resize(plate, (round(1375 * s), 230))
plate.save(OUT + 'mg-print-bed.png'); meta['printBed'] = {'printBottom': [round(320 * s), round(1090 * s), round(705 * s)], 'size': plate.size}
spat = bed.crop(boxes[1])
spat = fit_h(spat, 100)
spat.save(OUT + 'mg-spatula.png')

panel = Image.open(U + '37017f47-image.png').convert('RGBA')
fit_w(panel, 300).save(OUT + 'mg-locker-panel.png')

for f, name in [('806d99ea', 'senior-jadzia'), ('3ee9a604', 'senior-zdzislaw'), ('c8c4d6d5', 'senior-halinka')]:
    im = load(f)
    box = components(im, dilate=12)[0]
    c = im.crop(box)
    c = fit_h(fit_h(c, 92), 46)
    c.save(OUT + name + '.png'); meta[name] = {'size': c.size}

json.dump(meta, open(OUT + 'meta.json', 'w'), indent=1, default=int)
print(json.dumps(meta, default=int))
