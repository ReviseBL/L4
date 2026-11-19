import sys
from PIL import Image, ImageDraw, ImageFont
name=sys.argv[1]; speed=float(sys.argv[2]) if len(sys.argv)>2 else 92
g=Image.open(f'out/{name}-spritesheet.png'); FW,FH=64,48; S=3
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14)
dirs=['PRZÓD','TYŁ','LEWO','PRAWO']; anims=[('IDLE',8),('WALK',2)]
cw,ch=FW*S,FH*S; padL=80; padT=30; W=padL+4*cw; H=padT+2*ch+150
frames=[]
for t in range(120):
    im=Image.new('RGBA',(W,H),(52,62,58,255)); d=ImageDraw.Draw(im)
    for i,n in enumerate(dirs): d.text((padL+i*cw+cw//2-25,8),n,fill=(235,230,220),font=font)
    for j,(n,step) in enumerate(anims):
        d.text((10,padT+j*ch+ch//2-8),n,fill=(235,230,220),font=font)
        f=(t//step)%6
        for i in range(4):
            row=j*4+i
            im.alpha_composite(g.crop((f*FW,row*FH,(f+1)*FW,(row+1)*FH)).resize((cw,ch),Image.NEAREST),(padL+i*cw,padT+j*ch))
    # walking lane at game scale x2
    y0=padT+2*ch+10; d.rectangle([0,y0,W,H],fill=(70,84,62,255)); d.rectangle([0,y0+40,W,y0+110],fill=(120,120,116,255))
    d.text((8,y0+4),f'chód w grze: {int(speed)}/s (patrol)',fill=(240,235,220),font=font)
    span=(W//2)-FW; per=span/speed; cyc=(t*0.04)/per; leg=int(cyc)%2; fr=cyc-int(cyc)
    x=span*fr if leg==0 else span*(1-fr); row=7 if leg==0 else 6; f=(t//2)%6
    spr=g.crop((f*FW,row*FH,(f+1)*FW,(row+1)*FH)).resize((FW*2,FH*2),Image.NEAREST)
    im.alpha_composite(spr,(int(x*2),y0+20))
    frames.append(im.convert('RGB'))
frames[0].save(f'out/{name}-preview.gif',save_all=True,append_images=frames[1:],duration=40,loop=0)
print('ok')
