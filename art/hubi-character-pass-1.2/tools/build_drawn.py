from legs import *
def hipblk(cx,cy,w,h):
    m=Image.new('L',(FW,FH),0); ImageDraw.Draw(m).ellipse([cx-w/2,cy-h/2,cx+w/2,cy+h/2],fill=255)
    a=np.array(m)>0; o=np.zeros((FH,FW,4),np.uint8); ring=nd.binary_dilation(a)&~a
    o[a]=PANTS+(255,); o[ring]=OUT+(255,); return o
def clean_sprint(u,face):
    YY,XX=np.mgrid[0:FH,0:FW]
    bad=(YY>56)&((XX>104) if face<0 else (XX<24))
    u[bad]=0; return u
def mirror(L): return L[:,::-1].copy()
# ---------- side ----------
def side(dir_row_walk,dir_row_sprint,face):
    upw=upper_body(tile(dir_row_walk,0),72,64)
    sup=[clean_sprint(upper_body(tile(dir_row_sprint,c),66,58),face) for c in range(6)]
    # hip x from upper body bottom
    def hipx(u,y):
        xs=np.nonzero(u[y-2:y+1,:,3].any(0))[0]; return (xs.min()+xs.max())/2
    hw=hipx(upw,70); hs=hipx(sup[0],64)
    w=side_frames([upw]*6,(hw,70),face,WALK,hipblock=hipblk(hw,68,30,12),L=(12,11))
    s=side_frames(sup,(hs+face*-4,66),face,SPRINT,hipblock=hipblk(hs+face*-4,64,26,12),L=(13,12))
    return w,s
wl,sl=side(6,10,-1)
wr,sr=side(7,11,1)
# ---------- front / back ----------
def front_leg(cx,top,bottom,shoe_front,dark=1.0):
    pm=Image.new('L',(FW,FH),0); d=ImageDraw.Draw(pm)
    d.rounded_rectangle([cx-7,top,cx+7,bottom-3],radius=4,fill=255)
    sm=Image.new('L',(FW,FH),0); ds=ImageDraw.Draw(sm)
    if shoe_front: ds.rounded_rectangle([cx-7,bottom-6,cx+7,bottom],radius=3,fill=255)
    else: ds.rounded_rectangle([cx-6,bottom-5,cx+6,bottom],radius=2,fill=255)
    pa=np.array(pm)>0; sa=np.array(sm)>0; pa&=~sa
    o=np.zeros((FH,FW,4),np.uint8); u=pa|sa; ring=nd.binary_dilation(u)&~u
    o[pa]=PANTS+(255,)
    L=pa&~np.roll(pa,1,axis=1); R=pa&~np.roll(pa,-1,axis=1)
    o[nd.binary_dilation(R)&pa]=PANTS_SH+(255,); o[L]=PANTS_HI+(255,)
    o[sa]=SHOE+(255,); o[sa&~np.roll(sa,-1,axis=0)]=SOLE+(255,)
    o[ring]=OUT+(255,)
    if dark!=1: o[...,:3]=(o[...,:3]*dark).astype(np.uint8)
    return o
def front(row_idle,row_walk,row_sprint,shoe_front):
    up=upper_body(tile(row_idle,0) if False else tile(row_walk,0),72,66)
    ups=upper_body(tile(row_sprint,0),72,66)
    xs=np.nonzero(up[40:66,:,3].any(0))[0]; cx=(xs.min()+xs.max())/2
    def frames(u,lift,bobamp,spread):
        out=[]
        for i in range(6):
            ph=2*math.pi*i/6; s=math.sin(ph)
            lA=round(lift*max(0,s)); lB=round(lift*max(0,-s))
            bob=2*round(bobamp*abs(math.cos(ph))/2)
            f=np.zeros((FH,FW,4),np.uint8)
            hb=hipblk(cx,70,34,12); 
            over(f,front_leg(cx-spread,69,91-lA,shoe_front, 0.92 if lA>0 else 1))
            over(f,front_leg(cx+spread,69,91-lB,shoe_front, 0.92 if lB>0 else 1))
            g=np.zeros_like(f); over(g,hb); over(g,u); over(f,shift(g,bob))
            out.append(f)
        return out
    return frames(up,8,2,8), frames(ups,10,4,9)
wd,sd=front(0,4,8,True)
wu,su=front(1,5,9,False)
rig=np.array(Image.open('out/rig-master.png'))
out=np.zeros((12*FH,6*FW,4),np.uint8); out[:4*FH]=rig[:4*FH]
for ai,group in [(1,[wd,wu,wl,wr]),(2,[sd,su,sl,sr])]:
    for di,fr in enumerate(group):
        r=ai*4+di
        for i,f in enumerate(fr): out[r*FH:(r+1)*FH,i*FW:(i+1)*FW]=f
Image.fromarray(out).save('out/drawn-master.png')
m=out.astype(np.float32)/255; pm=m.copy(); pm[...,:3]*=pm[...,3:4]
img=Image.fromarray((pm*255).astype(np.uint8),'RGBA')
small=np.array(img.resize((img.width//2,img.height//2),Image.LANCZOS)).astype(np.float32)/255
a=small[...,3:4]; rgb=np.where(a>0.01,small[...,:3]/np.maximum(a,1e-4),0)
a=a[...,0].copy(); a[a<0.12]=0; a[a>0.88]=1
g=np.dstack([np.clip(rgb,0,1)*255,a*255]).astype(np.uint8); g[a==0]=0
Image.fromarray(g).save('out/hubi-spritesheet.png')
strip=Image.new('RGBA',(768,96*8),(52,62,58,255))
for k,r in enumerate(range(4,12)): strip.alpha_composite(Image.fromarray(out[r*FH:(r+1)*FH]),(0,k*96))
strip.save('drawn_check.png'); print('ok')
