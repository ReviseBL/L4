import numpy as np, math
from PIL import Image
M=np.array(Image.open('out/hubi-spritesheet-master-128x96.png'))
FW,FH=128,96
def tile(r,c=0): return M[r*FH:(r+1)*FH,c*FW:(c+1)*FW].copy()
def layer(t,mask):
    o=np.zeros_like(t); o[mask]=t[mask]; return o
def shift(L,dx,dy):
    o=np.zeros_like(L); h,w=L.shape[:2]
    ys=slice(max(dy,0),h+min(dy,0)); yd=slice(max(-dy,0),h+min(-dy,0))
    xs=slice(max(dx,0),w+min(dx,0)); xd=slice(max(-dx,0),w+min(-dx,0))
    o[ys,xs]=L[yd,xd]; return o
def over(dst,src):
    m=src[...,3]>0; dst[m]=src[m]; return dst
def rot(L,deg,px,py):
    im=Image.fromarray(L); im=im.rotate(deg,resample=Image.NEAREST,center=(px,py)); return np.array(im)
def dark(L,f=0.72):
    o=L.copy(); o[...,:3]=(o[...,:3]*f).astype(np.uint8); return o
YY,XX=np.mgrid[0:FH,0:FW]

def front_rig(t,legy,split,lx0,lx1):
    a=t[...,3]>0
    legs=a&(YY>=legy)&(XX>=lx0)&(XX<=lx1)
    armL=a&(YY>=44)&(YY<legy+3)&(XX<lx0+2); armR=a&(YY>=44)&(YY<legy+3)&(XX>lx1-2)
    body=a&~legs&~armL&~armR
    return dict(body=layer(t,body),legL=layer(t,legs&(XX<split)),legR=layer(t,legs&(XX>=split)),armL=layer(t,armL),armR=layer(t,armR))
def front_frame(R,i,amp,swing,bobamp):
    ph=2*math.pi*i/6
    s=math.sin(ph)
    liftL=-2*round(amp*max(0,s)/2); liftR=-2*round(amp*max(0,-s)/2)
    bob=2*round(bobamp*abs(math.cos(ph))/2)  # down at contact
    arm=2*round(swing*s/2)
    f=np.zeros_like(R['body'])
    over(f,shift(R['legL'],0,liftL)); over(f,shift(R['legR'],0,liftR))
    over(f,shift(R['body'],0,bob)); over(f,shift(R['armL'],0,bob)); over(f,shift(R['armR'],0,bob))
    return f
def side_rig(t,legy,flip):
    a=t[...,3]>0
    ys,xs=np.nonzero(a&(YY>=legy))
    px=(xs.min()+xs.max())/2; py=legy-2
    legs=a&(YY>=legy-4)
    body=a&(YY<legy)
    return dict(body=layer(t,body),leg=layer(t,legs),px=px,py=py,flip=flip)
def side_frame(R,i,ampdeg,bobamp,lean=0):
    ph=2*math.pi*i/6; c=math.cos(ph)
    th=ampdeg*c*(-1 if R['flip'] else 1)
    bob=2*round(bobamp*abs(c)/2)
    f=np.zeros_like(R['body'])
    over(f,dark(rot(R['leg'],-th,R['px'],R['py'])))
    over(f,rot(R['leg'],th,R['px'],R['py']))
    body=R['body']
    if lean: body=rot(body,lean*(-1 if R['flip'] else 1),R['px'],R['py'])
    over(f,shift(body,0,bob))
    return f
def idle_frame(t,legy,i):
    a=t[...,3]>0
    body=layer(t,a&(YY<legy)); legs=layer(t,a&(YY>=legy-2))
    br=[0,0,0,2,2,2][i]
    f=np.zeros_like(t); over(f,legs); over(f,shift(body,0,br)); return f

src={'down':(0,70,64,44,85),'up':(1,68,64,44,84)}
out=np.zeros((12*FH,6*FW,4),np.uint8)
dirs=['down','up','left','right']
for di,d in enumerate(dirs):
    if d in src:
        r,legy,split,lx0,lx1=src[d]; t=tile(r)
        R=front_rig(t,legy,split,lx0,lx1)
        frames={'idle':[idle_frame(t,legy,i) for i in range(6)],
                'walk':[front_frame(R,i,6,0,2) for i in range(6)],
                'sprint':[front_frame(R,i,10,0,4) for i in range(6)]}
    else:
        r=2 if d=='left' else 3; t=tile(r); legy=68
        R=side_rig(t,legy,flip=(d=='right'))
        frames={'idle':[idle_frame(t,legy,i) for i in range(6)],
                'walk':[side_frame(R,i,28,2) for i in range(6)],
                'sprint':[side_frame(R,i,42,4,lean=8) for i in range(6)]}
    for ai,an in enumerate(['idle','walk','sprint']):
        for i,f in enumerate(frames[an]):
            row=ai*4+di; out[row*FH:(row+1)*FH,i*FW:(i+1)*FW]=f
Image.fromarray(out).save('out/rig-master.png')
# downscale like build.py
m=out.astype(np.float32)/255; pm=m.copy(); pm[...,:3]*=pm[...,3:4]
img=Image.fromarray((pm*255).astype(np.uint8),'RGBA')
small=np.array(img.resize((img.width//2,img.height//2),Image.LANCZOS)).astype(np.float32)/255
a=small[...,3:4]; rgb=np.where(a>0.01,small[...,:3]/np.maximum(a,1e-4),0)
a=a[...,0].copy(); a[a<0.12]=0; a[a>0.88]=1
g=np.dstack([np.clip(rgb,0,1)*255,a*255]).astype(np.uint8); g[a==0]=0
Image.fromarray(g).save('out/hubi-spritesheet.png'); print('ok')
