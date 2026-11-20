import sys
from PIL import Image
import numpy as np
from scipy import ndimage

def components(im, thr=40, dilate=8, min_area=400):
    a = np.array(im.getchannel('A')) > thr
    d = ndimage.binary_dilation(a, iterations=dilate)
    lab, n = ndimage.label(d)
    boxes = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        ys, xs = sl
        area = (lab[sl] == i).sum()
        if area < min_area: continue
        sub = a[sl] & (lab[sl] == i)
        yy, xx = np.nonzero(sub)
        boxes.append((xs.start + xx.min(), ys.start + yy.min(), xs.start + xx.max() + 1, ys.start + yy.max() + 1))
    boxes.sort(key=lambda b: b[0])
    return boxes

def resize(im, size):
    return im.convert('RGBa').resize(size, Image.LANCZOS).convert('RGBA')

def fit_h(im, h):
    w = max(1, round(im.width * h / im.height)); return resize(im, (w, h))

def fit_w(im, w):
    h = max(1, round(im.height * w / im.width)); return resize(im, (w, h))
