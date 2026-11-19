import numpy as np, scipy.ndimage as nd, json
from PIL import Image
a=np.array(Image.open('src/board.png')).astype(np.int32)
al=a[...,3].copy(); al[:,:330]=0
solid=(al>40)
colc=[412,614,814,1014,1215,1415]
labels_y=[52,133,223,313,414,491,578,652,752,827,902,975]
# find row splits per column via min alpha projection near midpoints
cells={}
for ci,cx in enumerate(colc):
    strip=solid[:,cx-100:cx+100]
    proj=strip.sum(1)
    splits=[0]
    for r in range(11):
        mid=(labels_y[r]+labels_y[r+1])//2
        lo,hi=mid-25,mid+25
        y=lo+int(np.argmin(proj[lo:hi]))
        splits.append(y)
    splits.append(1024)
    for r in range(12):
        y0,y1=splits[r],splits[r+1]
        sub=strip[y0:y1]
        lab,n=nd.label(nd.binary_dilation(sub,iterations=1))
        # keep largest component(s) >5% of max
        sizes=nd.sum(sub,lab,range(1,n+1))
        keep=[i+1 for i,s in enumerate(sizes) if s>0.05*max(sizes)]
        mask=np.isin(lab,keep)&sub
        ys,xs=np.nonzero(mask)
        cells[(r,ci)]=dict(y0=int(y0+ys.min()),y1=int(y0+ys.max()+1),x0=int(cx-100+xs.min()),x1=int(cx-100+xs.max()+1),splitmin=int(proj[splits[r]]) if r else 0)
W=[c['x1']-c['x0'] for c in cells.values()];H=[c['y1']-c['y0'] for c in cells.values()]
print('max w',max(W),'max h',max(H))
for r in range(12):
    print(r,[ (cells[(r,c)]['x1']-cells[(r,c)]['x0'],cells[(r,c)]['y1']-cells[(r,c)]['y0'],cells[(r,c)]['splitmin']) for c in range(6)])
json.dump({f'{k[0]},{k[1]}':v for k,v in cells.items()},open('cells.json','w'))
import numpy as np, json, scipy.ndimage as nd
from PIL import Image, ImageDraw
src=np.array(Image.open('src/board.png'))
cells=json.load(open('cells.json'))
colc=[412,614,814,1014,1215,1415]
# row split lines recomputed from cells: use cell boxes, but mask to that box and clean alpha
FW=128; FH=96; BASE=92
anims=['idle','walk','sprint']; dirs=['down','up','left','right']
master=np.zeros((12*FH,6*FW,4),np.uint8)
info=[]
for r in range(12):
    crops=[]
    for c in range(6):
        b=cells[f'{r},{c}']
        cr=src[b['y0']:b['y1'],b['x0']:b['x1']].copy()
        al=cr[...,3].astype(int)
        al[al<=40]=0; al[al>=235]=255
        cr[...,3]=al
        cr[al==0]=0
        lab,n=nd.label(nd.binary_dilation(al>0,iterations=1))
        if n>1:
            sizes=nd.sum(al>0,lab,range(1,n+1)); keep=int(np.argmax(sizes))+1
            drop=(lab!=keep)&(al>0); cr[drop]=0; al=cr[...,3].astype(int)
        m=al>128
        h=m.shape[0]; up=m[:int(h*0.45)]
        ys,xs=np.nonzero(up)
        ucx=xs.mean()
        crops.append((cr,ucx,b))
    rowbottom=max(b['y1'] for _,_,b in crops)
    for c,(cr,ucx,b) in enumerate(crops):
        h,w=cr.shape[:2]
        dx=int(round(FW/2-ucx)); dy=BASE-(rowbottom-b['y0'])
        y0=r*FH+dy; x0=c*FW+dx
        assert dy>=0 and dx>=0 and dx+w<=FW and dy+h<=FH, (r,c,dx,dy,w,h)
        tile=master[r*FH:(r+1)*FH, c*FW:(c+1)*FW]
        sub=tile[dy:dy+h, dx:dx+w]
        mask=cr[...,3]>0
        sub[mask]=cr[mask]
Image.fromarray(master).save('out/hubi-spritesheet-master-128x96.png')
# game sheet: 2x downscale with premultiplied alpha
m=master.astype(np.float32)/255
pm=m.copy(); pm[...,:3]*=pm[...,3:4]
img=Image.fromarray((pm*255).astype(np.uint8),'RGBA')
small=np.array(img.resize((img.width//2,img.height//2),Image.LANCZOS)).astype(np.float32)/255
a=small[...,3:4]; rgb=np.where(a>0.01,small[...,:3]/np.maximum(a,1e-4),0)
a=a[...,0].copy(); a[a<0.12]=0; a[a>0.88]=1
out=np.dstack([np.clip(rgb,0,1)*255,a*255]).astype(np.uint8)
out[a==0]=0
Image.fromarray(out).save('out/hubi-spritesheet.png')
print('master',master.shape,'game',out.shape)
