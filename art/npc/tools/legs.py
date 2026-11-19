import numpy as np, math, scipy.ndimage as nd
from PIL import Image, ImageDraw
FW,FH=128,96
THIGH_W=15; SHIN_W=12; HIP_R=7.5; KNEE_R=6; ANK_R=5.5
PANTS=(88,93,98); PANTS_HI=(112,117,122); PANTS_SH=(66,70,75); OUT=(30,26,24)
SHOE=(205,200,193); SHOE_SH=(150,145,139); SOLE=(70,64,58)
def is_pants(t):
    c=t[...,:3].astype(int); r,g,b=c[...,0],c[...,1],c[...,2]; mx=c.max(-1)
    return (t[...,3]>0)&(np.abs(r-b)<22)&(mx<135)
def upper_body(t,cut,pantsfrom):
    YY=np.arange(FH)[:,None]*np.ones((1,FW),int)
    keep=(t[...,3]>0)&(YY<cut)&~(is_pants(t)&(YY>=pantsfrom))
    lab,n=nd.label(keep); 
    if n>1:
        sz=nd.sum(keep,lab,range(1,n+1)); keep=lab==(int(np.argmax(sz))+1)
    o=np.zeros_like(t); o[keep]=t[keep]; return o
def leg_geom(hip,a,k,face,L1=9,L2=8):
    ar=math.radians(a); br=math.radians(a-k)
    knee=(hip[0]+face*L1*math.sin(ar), hip[1]+L1*math.cos(ar))
    ank=(knee[0]+face*L2*math.sin(br), knee[1]+L2*math.cos(br))
    return knee,ank
def draw_leg(hip,a,k,face,dark=1.0,L=(9,8)):
    knee,ank=leg_geom(hip,a,k,face,L[0],L[1])
    pm=Image.new('L',(FW,FH),0); d=ImageDraw.Draw(pm)
    d.line([hip,knee],fill=255,width=THIGH_W); d.line([knee,ank],fill=255,width=SHIN_W)
    for p,rad in [(hip,HIP_R),(knee,KNEE_R),(ank,ANK_R)]: d.ellipse([p[0]-rad,p[1]-rad,p[0]+rad,p[1]+rad],fill=255)
    sm=Image.new('L',(FW,FH),0); ds=ImageDraw.Draw(sm)
    # shoe: pitch follows shin a bit when lifted
    pitch=math.radians(max(-25,min(25,(a-k)*0.4))) if k>15 else 0
    def P(dx,dy):
        return (ank[0]+face*(dx*math.cos(pitch)-dy*math.sin(pitch)), ank[1]+dx*math.sin(pitch)+dy*math.cos(pitch))
    shoe=[P(-6,0),P(8,0),P(12,2),P(13,5),P(12,6),P(-6,6),P(-7,3)]
    ds.polygon(shoe,fill=255)
    pa=np.array(pm)>0; sa=np.array(sm)>0
    return pa,sa,ank,max(p[1] for p in shoe)
def render_leg(pa,sa,dark,face):
    o=np.zeros((FH,FW,4),np.uint8)
    u=pa|sa; ring=nd.binary_dilation(u)&~u
    o[pa]=PANTS+(255,)
    # shading: back edge (opposite of face) darker, front edge lighter
    back=pa&~np.roll(pa,-face,axis=1); front=pa&~np.roll(pa,face,axis=1)
    o[nd.binary_dilation(back)&pa]=PANTS_SH+(255,); o[front]=PANTS_HI+(255,)
    o[sa]=SHOE+(255,); 
    sole=sa&~np.roll(sa,-1,axis=0); o[sole]=SOLE+(255,)
    o[ring]=OUT+(255,)
    if dark!=1.0: o[...,:3]=(o[...,:3]*dark).astype(np.uint8)
    return o
def over(dst,src):
    m=src[...,3]>0; dst[m]=src[m]; return dst
def shift(L,dy):
    return np.roll(L,dy,axis=0) if dy else L
WALK=[(34,4),(16,16),(-6,6),(-32,8),(-22,58),(20,48)]
SPRINT=[(48,14),(22,30),(-14,12),(-48,18),(-34,95),(30,100)]
def side_frames(uppers,hip,face,cycle,ground=91,hipblock=None,L=(9,8)):
    out=[]
    for i in range(6):
        A=cycle[i]; B=cycle[(i+3)%6]
        la=draw_leg(hip,A[0],A[1],face,L=L); lb=draw_leg(hip,B[0],B[1],face,L=L)
        low=max(la[3],lb[3]); dy=int(round(ground-low))
        dy=dy-(dy%2)  # even -> clean 1px at game scale
        f=np.zeros((FH,FW,4),np.uint8)
        # far leg = B (darker), near = A ; alternate which is near each half cycle for readability
        over(f,shift(render_leg(lb[0],lb[1],0.72,face),dy))
        over(f,shift(render_leg(la[0],la[1],1.0,face),dy))
        if hipblock is not None: over(f,shift(hipblock,dy))
        over(f,shift(uppers[i%len(uppers)],dy))
        out.append(f)
    return out
