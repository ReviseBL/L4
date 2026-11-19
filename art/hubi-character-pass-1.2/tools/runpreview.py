from PIL import Image, ImageDraw
g=Image.open('out/hubi-spritesheet.png'); FW,FH=64,48
W,H=560,150; S=2
def bgimg():
    im=Image.new('RGBA',(W,H),(70,84,62,255)); d=ImageDraw.Draw(im)
    d.rectangle([0,60,W,110],fill=(120,120,116,255))
    for x in range(0,W,24): d.line([x,60,x,110],fill=(108,108,104,255))
    d.line([0,60,W,60],fill=(150,150,145,255)); d.line([0,110,W,110],fill=(150,150,145,255))
    d.text((6,4),'WALK 175/s  |  SPRINT 285/s (predkosci z gry)',fill=(240,235,220,255))
    return im
lanes=[('walk',6,7,175,12,40),('sprint',10,11,285,12,118)]  # rowL,rowR,speed,fps,y
frames=[]; T=4.0; dt=0.04
for k in range(int(T/dt)):
    t=k*dt; im=bgimg()
    for name,rl,rr,sp,fps,y in lanes:
        span=W-FW; per=span/sp; cyc=(t/per)
        leg=int(cyc)%2; frac=cyc-int(cyc)
        x=span*frac if leg==0 else span*(1-frac)
        row=rr if leg==0 else rl
        f=int(t*fps)%6
        im.alpha_composite(g.crop((f*FW,row*FH,(f+1)*FW,(row+1)*FH)),(int(x),y-48+20))
    frames.append(im.resize((W*S,H*S),Image.NEAREST).convert('RGB'))
frames[0].save('out/hubi-in-motion.gif',save_all=True,append_images=frames[1:],duration=40,loop=0)
print(len(frames))
