import numpy as np, json, itertools, scipy.ndimage as nd
from PIL import Image
src=np.array(Image.open('src/board.png')); cells=json.load(open('cells.json'))
rigM=np.array(Image.open('out/rig-master.png'))
FW,FH,BASE=128,96,92
def crop(r,c):
    b=cells[f'{r},{c}']; cr=src[b['y0']:b['y1'],b['x0']:b['x1']].copy()
    al=cr[...,3].astype(int); al[al<=40]=0; al[al>=235]=255; cr[...,3]=al; cr[al==0]=0
    lab,n=nd.label(nd.binary_dilation(al>0))
    if n>1:
        sz=nd.sum(al>0,lab,range(1,n+1)); k=int(np.argmax(sz))+1; cr[(lab!=k)&(al>0)]=0
    return cr,b
def canvas(cr,dx,dy):
    t=np.zeros((FH,FW,4),np.uint8); h,w=cr.shape[:2]
    ys=slice(max(dy,0),min(dy+h,FH)); xs=slice(max(dx,0),min(dx+w,FW))
    t[ys,xs]=cr[ys.start-dy:ys.stop-dy, xs.start-dx:xs.stop-dx]; return t
def feat(t):  # upper body signature: alpha + luma
    a=t[...,3]/255.; l=t[...,:3].mean(-1)/255.*a
    return np.stack([a,l],-1)
report={}
out=np.zeros((12*FH,6*FW,4),np.uint8)
out[:4*FH]=rigM[:4*FH]   # idle from rig (approved)
for r in range(4,12):
    crs=[crop(r,c) for c in range(6)]
    rowbottom=max(b['y1'] for _,b in crs)
    # initial placement: preserve board registration relative to column grid & row baseline
    colc=[412,614,814,1014,1215,1415]
    tiles=[]
    for c,(cr,b) in enumerate(crs):
        dx=int(FW/2-(colc[c]-b['x0'])); dy=BASE-(rowbottom-b['y0'])
        tiles.append((cr,dx,dy))
    # register frames 1..5 to frame 0 on upper body (top 50% of figure)
    ref=feat(canvas(*tiles[0]))
    top=int(np.nonzero(ref[...,0].any(1))[0].min()); bot=BASE
    cut=top+int((bot-top)*0.5)
    reg=[tiles[0]]
    for cr,dx,dy in tiles[1:]:
        best=None
        for ox in range(-8,9):
            for oy in range(-4,5):
                f=feat(canvas(cr,dx+ox,dy+oy))
                e=np.abs(f[top:cut]-ref[top:cut]).sum()
                if best is None or e<best[0]: best=(e,ox,oy)
        reg.append((cr,dx+best[1],dy+best[2]))
    # fix vertical: keep feet on ground -> use oy only if small; recentre so mean dx shift is 0
    frames=[canvas(*t) for t in reg]
    # recentre whole row: upper-body centroid at FW/2
    ucx=np.mean([np.nonzero(f[top:cut,:,3]>128)[1].mean() for f in frames]); sh=int(round(FW/2-ucx))
    frames=[np.roll(f,sh,axis=1) for f in frames]
    # order: maximize leg change along cycle
    legs=[f[cut+6:,:,3]>128 for f in frames]
    D=np.array([[1-(legs[i]&legs[j]).sum()/max((legs[i]|legs[j]).sum(),1) for j in range(6)] for i in range(6)])
    bestp=max((p for p in itertools.permutations(range(1,6))), key=lambda p: (min(D[a][b] for a,b in zip((0,)+p,p+(0,))), sum(D[a][b] for a,b in zip((0,)+p,p+(0,)))))
    order=(0,)+bestp
    report[r]=dict(order=order,legdiff=[round(D[a][b],2) for a,b in zip(order,order[1:]+order[:1])])
    for i,k in enumerate(order): out[r*FH:(r+1)*FH,i*FW:(i+1)*FW]=frames[k]
Image.fromarray(out).save('out/final-master.png')
m=out.astype(np.float32)/255; pm=m.copy(); pm[...,:3]*=pm[...,3:4]
img=Image.fromarray((pm*255).astype(np.uint8),'RGBA')
small=np.array(img.resize((img.width//2,img.height//2),Image.LANCZOS)).astype(np.float32)/255
a=small[...,3:4]; rgb=np.where(a>0.01,small[...,:3]/np.maximum(a,1e-4),0)
a=a[...,0].copy(); a[a<0.12]=0; a[a>0.88]=1
g=np.dstack([np.clip(rgb,0,1)*255,a*255]).astype(np.uint8); g[a==0]=0
Image.fromarray(g).save('out/hubi-spritesheet.png')
for k,v in report.items(): print(k,v)
