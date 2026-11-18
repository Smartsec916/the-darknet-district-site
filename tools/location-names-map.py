# Draws docs/development/location-names-map.png from the shapes tools/location-names.cjs writes with --json.
# Usage: node tools/location-names.cjs --json /tmp/places.json && python3 tools/location-names-map.py /tmp/places.json docs/development/location-names-map.png YYYY-MM-DD   (needs Pillow)
import json,sys
from PIL import Image,ImageDraw,ImageFont
D=json.load(open(sys.argv[1]));OUT=sys.argv[2]
F=lambda s,b=False:ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans'+('-Bold' if b else '')+'.ttf',s)
W,H=2500,2330;img=Image.new('RGB',(W,H),'#0b0f14');d=ImageDraw.Draw(img)
by={x['id']:x for x in D}
AREA_COL={'port':'#3a6ea5','oldtown':'#8a5a9e','avenue':'#3f8f7a','far-south':'#a5763a','outskirts':'#7a7a52'}
def anc(x):
    # top-level area id for a node (depth 4 = area under city)
    return None
areas=[x for x in D if x['level']=='area']
area_of={}
for x in D:
    for a in areas:
        pass
def rect_px(r,ox,oz,s,X0,Z1):
    x0,x1,z0,z1=r;return (ox+(x0-X0)*s,oz+(Z1-z1)*s,ox+(x1-X0)*s,oz+(Z1-z0)*s)
def label(xy,t,f,fill='#ffffff',bg='#000000cc',r=None):
    tw=d.textlength(t,font=f);h=f.size+4;x,y=xy
    d.rounded_rectangle((x-tw/2-4,y-h/2,x+tw/2+4,y+h/2),radius=4,fill=bg[:7],outline='#ffffff55')
    d.text((x-tw/2,y-h/2+1),t,font=f,fill=fill)
def inside(r,R):return r[0]>=R[0]-.01 and r[1]<=R[1]+.01 and r[2]>=R[2]-.01 and r[3]<=R[3]+.01
def draw_panel(title,ox,oz,s,X0,X1,Z0,Z1,nodes,skip_inside=None,small=11):
    d.rectangle((ox,oz,ox+(X1-X0)*s,oz+(Z1-Z0)*s),outline='#2c3a48',width=2)
    d.text((ox,oz-30),title,font=F(20,True),fill='#e8f0ff')
    order=sorted(nodes,key=lambda x:(x['depth'],x['fallback']==False))
    for x in order:
        col=AREA_COL.get(x['id'])
        for r in x['rects']:
            if not (r[1]>X0 and r[0]<X1 and r[3]>Z0 and r[2]<Z1):continue
            r=[max(r[0],X0),min(r[1],X1),max(r[2],Z0),min(r[3],Z1)]
            p=rect_px(r,ox,oz,s,X0,Z1)
            if x['level']=='area':d.rectangle(p,fill=col or '#333',outline=None)
            elif x['level']=='venue':d.rectangle(p,fill='#1a1f2a',outline='#ff5bd0',width=3)
            elif x['shop']:d.rectangle(p,fill='#4a3a10',outline='#ffcf5a',width=1)
            else:d.rectangle(p,outline='#e8f0ff',width=1 if not x['fallback'] else 1)
    placed=[]
    for x in sorted(nodes,key=lambda x:-x['depth']):
        if x['level']=='area':continue
        r=x['rects'][0]
        if not (r[1]>X0 and r[0]<X1 and r[3]>Z0 and r[2]<Z1):continue
        cx=(max(r[0],X0)+min(r[1],X1))/2;cz=(max(r[2],Z0)+min(r[3],Z1))/2
        if x['fallback']:cz=max(r[2],Z0)+ (min(r[3],Z1)-max(r[2],Z0))*.25
        if x['level']=='venue' and X0==r[0]:cz=min(r[3],Z1)-1.2
        px,py=ox+(cx-X0)*s,oz+(Z1-cz)*s
        for (qx,qy) in placed:
            if abs(qx-px)<26 and abs(qy-py)<16:py+=17
        placed.append((px,py))
        t=str(x['no'])
        if x['level']=='venue':label((px,py),t+' '+x['name'],F(small+3,True),'#ff9be6')
        elif x['shop']:label((px,py),t,F(small),'#ffcf5a')
        else:label((px,py),t,F(small,True),'#ffffff' if not x['proposed'] else '#7ff0ff')
    for a in areas:
        if a['id'] not in AREA_COL:continue
# --- city panel
city=[x for x in D if not any(inside(r,by['district']['rects'][0]) or inside(r,by['null']['rects'][0]) or inside(r,by['milked']['rects'][0]) for r in x['rects']) or x['level'] in('area','venue')]
X0,X1,Z0,Z1=4,156,-263,-2;s=8;ox,oz=60,90
draw_panel('NeoChinatown from above (north up, 1 square = 10 m)',ox,oz,s,X0,X1,Z0,Z1,city)
for gx in range(10,156,10):d.line((ox+(gx-X0)*s,oz,ox+(gx-X0)*s,oz+(Z1-Z0)*s),fill='#1a2430')
for gz in range(-260,0,10):d.line((ox,oz+(Z1-gz)*s,ox+(X1-X0)*s,oz+(Z1-gz)*s),fill='#1a2430')
# area names
for a in areas:
    if a['id'] not in AREA_COL:continue
    r=a['rects'][0];px=ox+((r[0]+r[1])/2-X0)*s;py=oz+(Z1-(r[3]))*s+14
    if a['id']=='avenue':py=oz+(Z1-r[2])*s+14
    label((px,py),str(a['no'])+' '+a['name'].upper(),F(16,True),'#ffffff','#000000')
# --- insets
def inset(vid,title,s,y,ox=1330):
    R=by[vid]['rects'][0];nodes=[x for x in D if x['id']==vid or any(inside(r,R) for r in x['rects']) and x['level'] not in('area',)]
    nodes=[x for x in nodes if x['id']!=vid or True]
    draw_panel(title,ox,y,s,R[0],R[1],R[2],R[3],nodes,small=12)
    return y+(R[3]-R[2])*s
y=inset('district',str(by['district']['no'])+' The Darknet District (inset)',16,90)
y=inset('null',str(by['null']['no'])+' NULL (inset)',22,y+80)
y=inset('milked',str(by['milked']['no'])+' Milked (inset)',26,y+80)
# legend
ly=y+50;lx=1330
d.text((lx,ly),'How to read it',font=F(18,True),fill='#e8f0ff');ly+=28
for c,t in [('#ffffff','white number: exact location with a name the game already has'),('#7ff0ff','cyan number: PROPOSED working name (yours to name)'),('#ffcf5a','gold number: shopfront, named by its neon sign'),('#ff9be6','pink: venue (a building with rooms; rooms in the insets)')]:
    d.rectangle((lx,ly+3,lx+14,ly+17),fill=c);d.text((lx+22,ly),t,font=F(15),fill='#d0d8e4');ly+=24
d.text((lx,ly+6),'Numbers are the # column of LOCATION_NAMES.md. The Corporate District,',font=F(14),fill='#9aa6b4');ly+=24
d.text((lx,ly+6),'the Temple and the VR rooms are separate scenes: listed in the sheet only.',font=F(14),fill='#9aa6b4')
d.text((60,20),'VOID//RUNNER · Location names · review map (generated '+sys.argv[3]+')',font=F(28,True),fill='#ffffff')
img.save(OUT,optimize=True)
