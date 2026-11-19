import numpy as np, scipy.ndimage as nd, sys
from PIL import Image
src_path=sys.argv[1]; out=sys.argv[2]; H_TARGET=int(sys.argv[3]) if len(sys.argv)>3 else 88
a=np.array(Image.open(src_path).convert('RGBA'))
al=a[...,3]; solid=al>60
cols=solid.any(0)
# column runs = figures
runs=[];s=None
for x,v in enumerate(cols):
    if v and s is None: s=x
    if not v and s is not None:
        if x-s>20: runs.append((s,x))
        s=None
# merge runs separated by small gaps (<25px)
merged=[]
for r in runs:
    if merged and r[0]-merged[-1][1]<25: merged[-1]=(merged[-1][0],r[1])
    else: merged.append(r)
print('figures',merged)
assert len(merged)==4, merged
crops=[]
for x0,x1 in merged:
    sub=solid[:,x0:x1]; ys=np.nonzero(sub.any(1))[0]; y0,y1=ys.min(),ys.max()+1
    c=a[y0:y1,x0:x1].copy(); c[...,3]=np.where(c[...,3]<=40,0,c[...,3]); c[c[...,3]==0]=0
    lab,n=nd.label(nd.binary_dilation(c[...,3]>0,iterations=2))
    if n>1:
        sz=nd.sum(c[...,3]>0,lab,range(1,n+1)); keep=[i+1 for i,v in enumerate(sz) if v>0.02*sz.max()]
        c[~np.isin(lab,keep)]=0
    crops.append(c)
Hmax=max(c.shape[0] for c in crops); f=H_TARGET/Hmax
FW,FH,BASE=128,96,92
tiles=[]
for c in crops:
    im=Image.fromarray(c); pm=np.array(im).astype(np.float32)/255; pm[...,:3]*=pm[...,3:4]
    w,h=max(1,round(im.width*f)),max(1,round(im.height*f))
    sm=np.array(Image.fromarray((pm*255).astype(np.uint8)).resize((w,h),Image.LANCZOS)).astype(np.float32)/255
    al2=sm[...,3:4]; rgb=np.where(al2>0.01,sm[...,:3]/np.maximum(al2,1e-4),0)
    al2=al2[...,0]; al2[al2<0.15]=0; al2[al2>0.85]=1
    t=np.dstack([np.clip(rgb,0,1)*255,al2*255]).astype(np.uint8); t[al2==0]=0
    m=t[...,3]>128; up=m[:int(h*0.5)]; ucx=np.nonzero(up)[1].mean()
    tile=np.zeros((FH,FW,4),np.uint8); dx=int(round(FW/2-ucx)); dy=BASE-h
    sub=tile[dy:dy+h,dx:dx+w]; mk=t[...,3]>0; sub[mk]=t[mk]
    tiles.append(tile)
np.save(out,np.stack(tiles))
strip=Image.new('RGBA',(FW*4,FH),(52,62,58,255))
for i,t in enumerate(tiles): strip.alpha_composite(Image.fromarray(t),(i*FW,0))
strip.resize((FW*8,FH*2),Image.NEAREST).save(out+'.png'); print('scale',f)
