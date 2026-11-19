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
