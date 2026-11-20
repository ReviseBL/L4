"""Generuje przeskalowane rekwizyty (public/assets/world/*.png) i src/data/world/world-art.ts.
Każde rozmieszczenie: (grupa, źródło, cx, dolna krawędź y, szerokość[, opcje])."""
import json, numpy as np
from PIL import Image

def load(src, crop=None, rotate=0):
    im = Image.open(f'cut/{src}.png').convert('RGBA')
    if crop: im = im.crop(crop)
    if rotate: im = im.rotate(rotate, expand=True)
    bb = im.getbbox(); return im.crop(bb)

def resize(im, w, h):
    a = np.asarray(im).astype(np.float32) / 255; a[..., :3] *= a[..., 3:4]
    s = np.asarray(Image.fromarray((a * 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)).astype(np.float32) / 255
    al = s[..., 3:4]; rgb = np.where(al > 0.01, s[..., :3] / np.maximum(al, 1e-4), 0)
    al = al[..., 0]; al[al < 0.1] = 0; al[al > 0.9] = 1
    o = np.dstack([np.clip(rgb, 0, 1) * 255, al * 255]).astype(np.uint8); o[al == 0] = 0
    return Image.fromarray(o)

PH = 'props-shops/03'
SOURCES = {
    'printer': ('props-apartment/00', {}), 'desk': ('props-apartment/01', {}), 'sofa': ('props-apartment/02', {}),
    'wall-shelf': ('props-apartment/03', {}), 'spool': ('props-apartment/04', {}), 'spool-boxes': ('props-apartment/05', {}),
    'l4-print': ('props-apartment/08', {}),
    'hedge': ('props-estate/00', {}), 'dumpster': ('props-estate/01', {}), 'bench': ('props-estate/02', {}),
    'tree': ('props-estate/03', {}), 'lamp': ('props-estate/04', {}), 'trash-bin': ('props-estate/05', {}),
    'bike-rack': ('props-estate/06', {}), 'play-fence': ('props-estate/07', {}),
    'shop-counter': ('props-shops/00', {}), 'filament-shelf': ('props-shops/01', {}), 'tech-shelf': ('props-shops/02', {}),
    'pharmacy-counter': (PH, {'crop': (0, 180, 421, 396)}), 'pharmacy-cabinet': (PH, {'crop': (22, 8, 152, 176)}),
    'parcel-locker': ('props-shops/04', {}), 'kebab-kiosk': ('props-shops/05', {}), 'plant': ('props-shops/06', {}),
    'doormat': ('props-shops/07', {}),
    'sign-chwilka': ('signs/00', {}), 'sign-apteka': ('signs/01', {}), 'sign-3d-print-shop': ('signs/02', {}),
    'sign-tech-shop': ('signs/03', {}), 'sign-kebab': ('signs/04', {}),
    'car-red': ('parked-cars/00', {}), 'car-silver': ('parked-cars/01', {}),
    'car-green': ('parked-cars/02', {}), 'car-beige': ('parked-cars/03', {}),
    'company-car': ('company-car/00', {}),
    # Budynki (cały obraz) i stojak z chipsami
    'blok-23': ('buildings/building-blok-23', {}), 'blok-47': ('buildings/building-blok-47', {'crop': (0, 224, 1536, 1024)}),
    'office-bolttek': ('buildings/building-office', {}), 'chips-shelf': ('buildings/chips', {}),
    # V1 drzewa i krzewy
    'young-tree': ('props-trees/00', {}), 'birch': ('props-trees/01', {}), 'spruce': ('props-trees/02', {}),
    'chestnut': ('props-trees/03', {}), 'dead-tree': ('props-trees/04', {}), 'poplar': ('props-trees/05', {}),
    'lilac': ('props-trees/06', {}), 'boxwood': ('props-trees/07', {}),
    # G1 podwórko
    'trzepak': ('props-courtyard/00', {}), 'sandbox': ('props-courtyard/01', {}), 'swing': ('props-courtyard/02', {}),
    'flowerbed': ('props-courtyard/03', {}), 'waste-shelter': ('props-courtyard/04', {}), 'ad-column': ('props-courtyard/05', {}),
    'green-fence': ('props-courtyard/06', {}), 'leaf-pile': ('props-courtyard/07', {}),
    # G2 za blokami
    'garages': ('props-street/00', {}), 'kiosk': ('props-street/01', {}), 'bus-stop': ('props-street/02', {}),
    'hydrant': ('props-street/03', {}), 'bollard': ('props-street/04', {}), 'cart': ('props-street/06', {}),
    'pallets': ('props-street/07', {}), 'planter-tree': ('props-street/08', {}),
    # V2 detale na ziemi
    'manhole': ('decals/00', {}), 'drain': ('decals/01', {}), 'puddle': ('decals/02', {}), 'puddle-small': ('decals/03', {}),
    'cracks': ('decals/04', {}), 'hopscotch': ('decals/14', {}), 'oil-stain': ('decals/15', {}),
    'dandelions': ('decals/16', {}), 'missing-pavers': ('decals/17', {}),
    'leaves': ('decals2/04', {}), 'litter': ('decals2/05', {}),
}
# (grupa, źródło, cx, bottom, width, opcje: depth / center=True oznacza y jako środek / tint)
P = [
    ('apartment-printer', 'printer', 155, 222, 70, {}),
    ('apartment-sofa', 'sofa', 350, 236, 130, {}),
    ('apartment-desk', 'desk', 165, 392, 92, {}),
    ('apartment-filament-stack', 'spool-boxes', 405, 437, 75, {}),
    ('apartment-wall-shelf', 'wall-shelf', 430, 126, 66, {}),
    ('apartment-doormat', 'doormat', 285, 466, 52, {'depth': 1}),
    ('chwilka-counter', 'shop-counter', 905, 357, 90, {}),
    ('chwilka-counter', 'shop-counter', 995, 357, 90, {}),
    ('chwilka-doormat', 'doormat', 970, 466, 52, {'depth': 1}),
    ('print-shop-pla-shelf', 'filament-shelf', 1475, 295, 60, {}),
    ('print-shop-pla-shelf', 'filament-shelf', 1475, 365, 60, {}),
    ('print-shop-petg-shelf', 'filament-shelf', 1630, 295, 60, {}),
    ('print-shop-petg-shelf', 'filament-shelf', 1630, 365, 60, {}),
    ('print-shop-tech-shelf', 'tech-shelf', 1785, 295, 60, {}),
    ('print-shop-tech-shelf', 'tech-shelf', 1785, 365, 60, {}),
    ('print-shop-l4-pallet', 'spool-boxes', 1705, 427, 70, {}),
    ('print-shop-tpu', 'spool', 1805, 425, 34, {'tint': 0x9d4edd}),
    ('print-shop-doormat', 'doormat', 1630, 476, 52, {'depth': 1}),
    ('pharmacy-counter', 'pharmacy-counter', 735, 1192, 90, {}),
    ('pharmacy-counter', 'pharmacy-counter', 825, 1192, 90, {}),
    ('pharmacy-vitamins', 'pharmacy-cabinet', 670, 1290, 55, {}),
    ('pharmacy-doormat', 'doormat', 780, 1048, 52, {'depth': 1}),
    ('parcel-locker', 'parcel-locker', 1320, 1050, 92, {}),
    ('kebab-kiosk', 'kebab-kiosk', 1610, 1295, 100, {}),
    ('street-hedge', 'hedge', 760, 573, 76, {}),
    ('hide-hedge', 'hedge', 830, 552, 66, {}),
    ('street-dumpster', 'dumpster', 1270, 626, 84, {}),
    ('street-planter', 'plant', 1140, 907, 56, {}),
    ('street-planter', 'plant', 215, 932, 56, {}),
    ('parking-car', 'car-silver', 1545, 1000, 50, {'center': True, 'depth': 1053}),
    ('parking-car', 'car-red', 1815, 1000, 50, {'center': True, 'depth': 1053}),
    ('parking-car', 'car-green', 2080, 1000, 50, {'center': True, 'depth': 1053}),
    ('sign-chwilka', 'sign-chwilka', 1079, 480, 116, {'center': True, 'depth': 481}),
    ('sign-apteka', 'sign-apteka', 670, 1020, 128, {'center': True, 'depth': 1021}),
    ('sign-3d-print-shop', 'sign-3d-print-shop', 1757, 490, 150, {'center': True, 'depth': 491}),
    ('sign-tech-shop', 'sign-tech-shop', 1785, 140, 96, {'center': True, 'depth': 141}),
    ('sign-kebab', 'sign-kebab', 1610, 1210, 64, {'center': True, 'depth': 1296}),
    # Budynki w obrysie dawnych prostokątów (środek, szerokość×wysokość, głębia = dolna krawędź)
    ('building-blok-23', 'blok-23', 275, 1210, 430, {'center': True, 'height': 280, 'depth': 1350}),
    ('building-blok-47', 'blok-47', 1280, 1215, 480, {'center': True, 'height': 250, 'depth': 1340}),
    ('building-office', 'office-bolttek', 1910, 1200, 420, {'center': True, 'height': 280, 'depth': 1340}),
    ('chwilka-chips', 'chips-shelf', 1085, 265, 62, {}),
    # Dekoracje (bez kolizji, z dala od tras NPC)
    ('decor', 'tree', 640, 330, 92, {}), ('decor', 'birch', 560, 175, 80, {}), ('decor', 'flowerbed', 560, 330, 36, {}),
    ('decor', 'trzepak', 572, 450, 66, {}),
    ('decor', 'bench', 640, 470, 56, {}), ('decor', 'trash-bin', 700, 470, 22, {}),
    ('decor', 'lamp', 700, 540, 32, {}), ('decor', 'lamp', 1150, 540, 32, {}), ('decor', 'lamp', 2120, 540, 32, {}),
    ('decor', 'lamp', 450, 958, 32, {}), ('decor', 'lamp', 1200, 958, 32, {}), ('decor', 'lamp', 1700, 958, 32, {}),
    ('decor', 'bike-rack', 420, 528, 64, {}), ('decor', 'bollard', 415, 612, 10, {}), ('decor', 'bollard', 595, 612, 10, {}),
    ('decor', 'young-tree', 880, 532, 30, {}), ('decor', 'young-tree', 1330, 532, 30, {}), ('decor', 'young-tree', 1960, 532, 30, {}),
    ('decor', 'poplar', 850, 92, 36, {}), ('decor', 'poplar', 1720, 90, 36, {}),
    ('decor', 'chestnut', 1290, 255, 104, {}), ('decor', 'leaf-pile', 1250, 280, 30, {}), ('decor', 'bench', 1290, 450, 56, {}),
    ('decor', 'lilac', 1200, 125, 50, {}), ('decor', 'pallets', 1385, 470, 36, {}),
    ('decor', 'planter-tree', 1450, 534, 36, {}),
    ('decor', 'sandbox', 1950, 290, 44, {}), ('decor', 'swing', 2050, 300, 64, {}), ('decor', 'tree', 2140, 160, 90, {}),
    ('decor', 'bench', 2030, 482, 56, {}), ('decor', 'boxwood', 1880, 528, 30, {}), ('decor', 'spruce', 2165, 500, 62, {}),
    ('decor', 'hedge', 40, 120, 66, {}), ('decor', 'birch', 35, 495, 70, {}),
    ('decor', 'bus-stop', 110, 948, 100, {}), ('decor', 'tree', 40, 1065, 90, {}), ('decor', 'play-fence', 275, 1062, 96, {}),
    ('decor', 'bench', 400, 1050, 56, {}), ('decor', 'ad-column', 575, 1012, 28, {}),
    ('decor', 'lilac', 545, 1150, 46, {}), ('decor', 'hydrant', 545, 1245, 16, {}), ('decor', 'tree', 545, 1330, 92, {}),
    ('decor', 'boxwood', 1000, 1220, 30, {}),
    ('decor', 'waste-shelter', 1095, 1085, 70, {}), ('decor', 'bench', 1170, 1078, 56, {}),
    ('decor', 'bench', 1572, 1372, 56, {}), ('decor', 'dead-tree', 1690, 1385, 60, {}),
    ('decor', 'kiosk', 2155, 1045, 72, {}), ('decor', 'spruce', 2165, 1210, 60, {}), ('decor', 'tree', 2170, 1330, 90, {}),
    ('decor', 'hedge', 200, 1398, 76, {}), ('decor', 'hedge', 820, 1398, 76, {}), ('decor', 'hedge', 1400, 1398, 76, {}),
    # Detale na ziemi (płaskie, pod postaciami)
    ('decals', 'manhole', 900, 712, 24, {'depth': 2}), ('decals', 'manhole', 1650, 782, 24, {'depth': 2}),
    ('decals', 'drain', 760, 853, 26, {'depth': 2}), ('decals', 'drain', 1460, 632, 26, {'depth': 2}),
    ('decals', 'puddle', 1060, 604, 56, {'depth': 2}), ('decals', 'puddle-small', 1700, 1075, 34, {'depth': 2}),
    
    ('decals', 'cracks', 320, 776, 60, {'depth': 2}),
    ('decals', 'leaves', 1325, 298, 40, {'depth': 2}), ('decals', 'leaves', 700, 918, 36, {'depth': 2}),
    
    ('decals', 'hopscotch', 340, 600, 28, {'depth': 2}),
    ('decals', 'oil-stain', 1900, 1030, 40, {'depth': 2}),
    ('decals', 'dandelions', 745, 190, 24, {'depth': 2}), ('decals', 'dandelions', 1350, 440, 22, {'depth': 2}),
    ('decals', 'missing-pavers', 1290, 915, 34, {'depth': 2}),
]
# Warianty dekoracji, żeby powtórzenia nie wyglądały jak kopiuj-wklej:
# co drugi egzemplarz odbity, drzewa i krzaki w kilku odcieniach i rozmiarach.
import itertools
TREE_TINTS = [None, 0xe8f0c8, 0xc8d6b4, 0xf4e6b0]   # naturalny, jaśniejszy, ciemniejszy, jesienny
HEDGE_TINTS = [None, 0xd8e4c0, 0xbccfae]
TREE_SIZES = [92, 100, 84, 110]
_counter = itertools.count()
VARIED = []
for g, src, cx, y, w, o in P:
    if (g == 'decor' and src in ('tree', 'hedge', 'bench', 'trash-bin', 'lamp', 'birch', 'spruce', 'chestnut', 'lilac', 'boxwood', 'poplar', 'young-tree', 'dead-tree')) or g == 'decals':
        i = next(_counter); o = dict(o)
        if i % 2: o['flip'] = True
        if src == 'tree':
            w = TREE_SIZES[i % len(TREE_SIZES)]; t = TREE_TINTS[i % len(TREE_TINTS)]
            if t: o['tint'] = t
        if src == 'hedge':
            t = HEDGE_TINTS[i % len(HEDGE_TINTS)]
            if t: o['tint'] = t
    VARIED.append((g, src, cx, y, w, o))
P = VARIED
images, keyfor, placements = {}, {}, []
def asset(src_name, w, h_override=None):
    src, opts = SOURCES[src_name]
    im = load(src, opts.get('crop'), opts.get('rotate', 0))
    h = h_override or max(1, round(w * im.height / im.width))
    key = f'world-{src_name}-{w}x{h}'
    if key not in images: images[key] = resize(im, w, h)
    return key, w, h
for group, src_name, cx, y, w, o in P:
    key, w, h = asset(src_name, w, o.get('height'))
    cy = y if o.get('center') else y - h / 2
    depth = o.get('depth', y if not o.get('center') else y)
    extra = {}
    if 'tint' in o: extra['tint'] = o['tint']
    if o.get('flip'): extra['flipX'] = True
    placements.append(dict(group=group, key=key, x=round(cx, 1), y=round(cy, 1), depth=depth, **extra))
# home progression art (spool, L4 print) and company car
home = {'spool': asset('spool', 28), 'l4-print': asset('l4-print', 118)}
car = asset('company-car', 84)
for k, im in images.items(): im.save(f'out/props/{k}.png')
tiles = ['grass', 'sidewalk', 'asphalt', 'apartment', 'grocery', 'pharmacy', 'parking']

def ts_obj(d): return '{ ' + ', '.join(f"{k}: {json.dumps(v) if isinstance(v, str) else ('true' if v is True else ('0x%06x' % v if k == 'tint' else v))}" for k, v in d.items()) + ' }'
lines = [
    '// Plik generowany przez art/world/tools/build_world_art.py — nie edytować ręcznie.',
    '// Grafiki: ChatGPT (plansze z art/world/sources), przycięte i przeskalowane do rozmiaru w grze.',
    '',
    'export interface WorldArtPlacement {',
    '  group: string;', '  key: string;', '  x: number;', '  y: number;', '  depth: number;', '  tint?: number;', '  flipX?: boolean;', '}', '',
    "export type WorldTileId = " + ' | '.join(f"'{t}'" for t in tiles) + ';', '',
    'export const WORLD_TILE_TEXTURES: Readonly<Record<WorldTileId, { key: string; url: string }>> = {',
    *[f"  {json.dumps(t)}: {{ key: 'world-tile-{t}', url: 'assets/world/tile-{t}.png' }}," for t in tiles], '};', '',
    'export const WORLD_ART_TEXTURES: readonly { key: string; url: string }[] = [',
    *[f"  {{ key: {json.dumps(k)}, url: 'assets/world/{k}.png' }}," for k in sorted(images)], '];', '',
    'export const WORLD_ART_PLACEMENTS: readonly WorldArtPlacement[] = [',
    *[f'  {ts_obj(p)},' for p in placements], '];', '',
    '/** Grafiki elementów postępu mieszkania (szpula barwiona kolorem filamentu, wydruk L4). */',
    'export const HOME_ART = {',
    f"  spool: {{ key: {json.dumps(home['spool'][0])}, width: {home['spool'][1]}, height: {home['spool'][2]} }},",
    f"  l4Print: {{ key: {json.dumps(home['l4-print'][0])}, width: {home['l4-print'][1]}, height: {home['l4-print'][2]} }},",
    '} as const;', '',
    f"export const COMPANY_CAR_ART = {{ key: {json.dumps(car[0])}, width: {car[1]}, height: {car[2]} }} as const;", '',
]
open('out/world-art.ts', 'w').write('\n'.join(lines))
print(len(images), 'images,', len(placements), 'placements')
