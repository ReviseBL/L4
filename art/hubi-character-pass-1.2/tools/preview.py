import numpy as np
from PIL import Image, ImageDraw, ImageFont
g=Image.open('out/hubi-spritesheet.png'); FW,FH=64,48
S=3  # zoom
anims=[('IDLE',8),('WALK',2),('SPRINT',2)]; dirs=['PRZÓD','TYŁ','LEWO','PRAWO']
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14)
except: font=ImageFont.load_default()
cw,ch=FW*S,FH*S; padL=90; padT=30
W=padL+4*cw; H=padT+3*ch
def bg():
    im=Image.new('RGBA',(W,H),(52,62,58,255)); d=ImageDraw.Draw(im)
    for y in range(padT,H,12):
        for x in range(padL,W,12):
            if (x//12+y//12)%2: d.rectangle([x,y,x+11,y+11],fill=(58,69,64,255))
    for i,n in enumerate(dirs): d.text((padL+i*cw+cw//2-25,8),n,fill=(235,230,220),font=font)
    for j,(n,_) in enumerate(anims): d.text((10,padT+j*ch+ch//2-8),n,fill=(235,230,220),font=font)
    return im
frames=[]
for t in range(144):
    im=bg()
    for j,(n,step) in enumerate(anims):
        f=(t//step)%6
        for i in range(4):
            row=j*4+i
            tile=g.crop((f*FW,row*FH,(f+1)*FW,(row+1)*FH)).resize((cw,ch),Image.NEAREST)
            im.alpha_composite(tile,(padL+i*cw,padT+j*ch))
    frames.append(im.convert('RGB'))
frames[0].save('out/hubi-preview.gif',save_all=True,append_images=frames[1:],duration=40,loop=0,optimize=True)
# static contact sheet of game sheet at 2x on dark bg
cs=Image.new('RGBA',g.size,(52,62,58,255)); cs.alpha_composite(g)
cs.resize((g.width*2,g.height*2),Image.NEAREST).save('out/contact-2x.png')
print('ok')
