"""Animated NPC sheet from a 4-direction standing board (front, back, left, right).
Output: 6 cols x 8 rows (idle down/up/left/right, walk down/up/left/right), 64x48 game frames."""
import numpy as np, math, json, sys, scipy.ndimage as nd
from PIL import Image, ImageDraw
import legs
from legs import over, shift, side_frames, WALK, FW, FH

def is_color(t, kind):
    c=t[...,:3].astype(int); r,g,b=c[...,0],c[...,1],c[...,2]; a=t[...,3]>0
    if kind=='beige': return a&(r>110)&(r-b>22)&(g>85)
    if kind=='dark':
        mx=c.max(-1); mn=c.min(-1); return a&(mx<80)&(mx-mn<22)
    raise ValueError(kind)

def build(tiles, cfg):
    P=cfg
    legs.PANTS=tuple(P['pants']); legs.PANTS_HI=tuple(P['pants_hi']); legs.PANTS_SH=tuple(P['pants_sh'])
    legs.SHOE=tuple(P['shoe']); legs.SOLE=tuple(P['sole']); legs.OUT=tuple(P['outline'])
    legs.THIGH_W,legs.SHIN_W,legs.HIP_R,legs.KNEE_R,legs.ANK_R=P['widths']
    YY,XX=np.mgrid[0:FH,0:FW]
    hipy=P['hip_y']; legy=P['leg_y']
    def pants_mask(t): return is_color(t,P['pants_kind'])
    def leg_cx(t):
        m=pants_mask(t)&(YY>=legy+4)&(YY<legy+16); xs=np.nonzero(m)[1]; return xs.mean()
    def upper(t,cx,halfw):
        a=t[...,3]>0
        keep=a&(YY<hipy)
        # below hip: keep non-pants pixels outside the leg column (hands, mug, bag)
        keep|=a&(YY>=hipy)&(YY<legy+10)&~pants_mask(t)&((XX<cx-halfw)|(XX>cx+halfw))
        o=np.zeros_like(t); o[keep]=t[keep]; return o
    def hipblk(cx,cy,w,h):
        m=Image.new('L',(FW,FH),0); ImageDraw.Draw(m).ellipse([cx-w/2,cy-h/2,cx+w/2,cy+h/2],fill=255)
        a=np.array(m)>0; o=np.zeros((FH,FW,4),np.uint8); ring=nd.binary_dilation(a)&~a
        o[a]=legs.PANTS+(255,); o[ring]=legs.OUT+(255,); return o
    def idle(t):
        a=t[...,3]>0; body=np.zeros_like(t); body[a&(YY<hipy)]=t[a&(YY<hipy)]
        low=np.zeros_like(t); low[a&(YY>=hipy-2)]=t[a&(YY>=hipy-2)]
        out=[]
        for i in range(6):
            f=np.zeros_like(t); over(f,low); over(f,shift(body,[0,0,0,2,2,2][i])); out.append(f)
        return out
    def front_leg(cx,top,bottom,w):
        pm=Image.new('L',(FW,FH),0); d=ImageDraw.Draw(pm)
        d.rounded_rectangle([cx-w/2,top,cx+w/2,bottom-3],radius=3,fill=255)
        sm=Image.new('L',(FW,FH),0); ImageDraw.Draw(sm).rounded_rectangle([cx-w/2-1,bottom-6,cx+w/2+1,bottom],radius=3,fill=255)
        pa=np.array(pm)>0; sa=np.array(sm)>0; pa&=~sa
        o=np.zeros((FH,FW,4),np.uint8); u=pa|sa; ring=nd.binary_dilation(u)&~u
        o[pa]=legs.PANTS+(255,)
        L=pa&~np.roll(pa,1,axis=1); R=pa&~np.roll(pa,-1,axis=1)
        o[nd.binary_dilation(R)&pa]=legs.PANTS_SH+(255,); o[L]=legs.PANTS_HI+(255,)
        o[sa]=legs.SHOE+(255,); o[sa&~np.roll(sa,-1,axis=0)]=legs.SOLE+(255,)
        o[ring]=legs.OUT+(255,); return o
    def front_walk(t):
        cx=leg_cx(t); u=upper(t,cx,P['front_halfw'])
        out=[]
        for i in range(6):
            ph=2*math.pi*i/6; s=math.sin(ph)
            lA=round(P['lift']*max(0,s)); lB=round(P['lift']*max(0,-s))
            bob=2*round(2*abs(math.cos(ph))/2)
            f=np.zeros((FH,FW,4),np.uint8)
            over(f,front_leg(cx-P['spread'],hipy+1,91-lA,P['front_w']))
            over(f,front_leg(cx+P['spread'],hipy+1,91-lB,P['front_w']))
            g=np.zeros_like(f); over(g,hipblk(cx,hipy+3,2*P['spread']+P['front_w']+2,10)); over(g,u); over(f,shift(g,bob))
            out.append(f)
        return out
    def side_walk(t,face):
        cx=leg_cx(t); u=upper(t,cx,P['side_halfw'])
        return side_frames([u]*6,(cx,hipy+2),face,WALK,ground=91,hipblock=hipblk(cx,hipy+1,P['side_hip_w'],10),L=tuple(P['L']))
    rows=[idle(t) for t in tiles]
    rows+=[front_walk(tiles[0]),front_walk(tiles[1]),side_walk(tiles[2],-1),side_walk(tiles[3],1)]
    master=np.zeros((8*FH,6*FW,4),np.uint8)
    for r,fr in enumerate(rows):
        for c,f in enumerate(fr): master[r*FH:(r+1)*FH,c*FW:(c+1)*FW]=f
    return master

def downscale(master):
    m=master.astype(np.float32)/255; pm=m.copy(); pm[...,:3]*=pm[...,3:4]
    img=Image.fromarray((pm*255).astype(np.uint8),'RGBA')
    small=np.array(img.resize((img.width//2,img.height//2),Image.LANCZOS)).astype(np.float32)/255
    a=small[...,3:4]; rgb=np.where(a>0.01,small[...,:3]/np.maximum(a,1e-4),0)
    a=a[...,0].copy(); a[a<0.12]=0; a[a>0.88]=1
    g=np.dstack([np.clip(rgb,0,1)*255,a*255]).astype(np.uint8); g[a==0]=0; return g

if __name__=='__main__':
    tiles=np.load(sys.argv[1]); cfg=json.load(open(sys.argv[2])); name=sys.argv[3]
    master=build(tiles,cfg)
    Image.fromarray(master).save(f'out/{name}-master-128x96.png')
    Image.fromarray(downscale(master)).save(f'out/{name}-spritesheet.png')
    print('ok',master.shape)
