from PIL import Image
import numpy as np
from scipy import ndimage
from slice import components, fit_h, fit_w, resize
U='/mnt/user-data/uploads/'
O='r4/'
def load(f): return Image.open(U+f+'-image.png').convert('RGBA')
def main_only(im):
    a=np.array(im.getchannel('A'))>40
    lab,n=ndimage.label(ndimage.binary_dilation(a,iterations=3))
    if n<=1: return im
    sizes=ndimage.sum(a,lab,range(1,n+1)); keep=np.argmax(sizes)+1
    arr=np.array(im); arr[lab!=keep]=0
    out=Image.fromarray(arr); return out.crop(out.getbbox())
def crop(im,b): return im.crop(tuple(int(v) for v in b))
def two(im, h=None, w=None):
    # two-step downscale for pixel-art crispness
    if h:
        mid=fit_h(im, h*2); return fit_h(mid, h)
    mid=fit_w(im, w*2); return fit_w(mid, w)
def save(im,name): im.save(O+name+'.png'); print(name, im.size)

# kitchen sheet
k=load('e2393b6a'); kb=components(k, min_area=2000)
byx=sorted(kb,key=lambda b:(b[1]>400, b[0]))
top=[b for b in byx if b[1]<400]; bot=[b for b in byx if b[1]>=400]
counter,fridge,cabinet=[crop(k,b) for b in top]
save(two(counter,w=100),'kitchen-counter'); save(two(fridge,h=74),'kitchen-fridge'); save(two(cabinet,w=72),'kitchen-cabinet')
names=['pills','milk','coffee','grocery-bag','kebab-wrapper','usb-coil','spool-stack']
widths={'pills':17,'milk':None,'coffee':11,'grocery-bag':18,'kebab-wrapper':18,'usb-coil':18,'spool-stack':None}
heights={'milk':17,'spool-stack':26}
for n,b in zip(names,bot):
    im=main_only(crop(k,b)) if n!='kebab-wrapper' else crop(k,b)
    save(two(im,h=heights[n]) if n in heights else two(im,w=widths[n]),'home-'+n)
# carried items
c=load('d8dafd62'); cb=components(c,min_area=2000)
spools=sorted([b for b in cb if b[1]<200],key=lambda b:b[0]); rest=sorted([b for b in cb if b[1]>=200],key=lambda b:b[0])
for n,b in zip(['teal','orange','black','purple','red'],spools): save(two(crop(c,b),w=24),'carry-spool-'+n)
for n,w in zip(['l4-box','parcel-small','parcel-large','kebab','coffee','groceries'],[28,20,36,15,12,22]):
    pass
for (n,w),b in zip([('l4-box',28),('parcel-small',20),('parcel-large',36),('kebab',15),('coffee',12),('groceries',22)],rest):
    save(two(crop(c,b),w=w),'carry-'+n)
# phone frame
p=load('e911e2e7'); pb=components(p,min_area=2000)[0]
ph=crop(p,pb); save(resize(ph,(172,round(172*ph.height/ph.width))),'phone-frame')
print('phone crop', pb, ph.size)
# hubi phone (4 views): front,back,left-facing,right-facing
h=load('d1349f1f'); hb=sorted(components(h,min_area=2000),key=lambda b:b[0])
hv=[two(crop(h,b),h=44) for b in hb]
for i,v in enumerate(hv): save(v,f'hubi-phone-{i}')
# seba
s=load('61fcafee'); sb=sorted(components(s,min_area=2000),key=lambda b:b[0])
sv=[two(main_only(crop(s,b)),h=46) for b in sb]
for i,v in enumerate(sv): save(v,f'seba-{i}')
