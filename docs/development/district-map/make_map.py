import json,subprocess,html
# Real geometry from the game (world coords) -> the District's own frame: x to the RIGHT when walking in from the street, z increasing inward.
out=subprocess.run(['node','-e','''const N=require("../../../void-runner/neochinatown.js");const L=N.layout("interior");console.log(JSON.stringify({s:L.solids.map(s=>({id:s.id,p:s.position,z:s.size})),i:L.interactions.map(i=>({id:i.id,p:i.position,l:i.label}))}))'''],capture_output=True,text=True).stdout
D=json.loads(out)
DX,DZ=126.9,-61.9+20
loc=lambda wx,wz:(DX-wx,DZ-wz)
solids={s['id']:s for s in D['s']}
def box(sid):
    s=solids[sid];x,z=loc(s['p'][0],s['p'][2]);w,d=s['z'][0],s['z'][2];return (x-w/2,z-d/2,x+w/2,z+d/2)
inter={i['id']:loc(i['p'][0],i['p'][2])+(i['l'],) for i in D['i']}

X0,Z0=-24,8.5        # metres at the top-left of the map area
S=15.5               # pixels per metre
PX,PY=40,150         # map origin on the canvas
W,H=1500,1300
def px(x,z): return (PX+(x-X0)*S, PY+(z-Z0)*S)
def rect(x0,z0,x1,z1,**a):
    x,y=px(x0,z0);w=(x1-x0)*S;h=(z1-z0)*S
    attrs=' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items());return f'<rect x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" {attrs}/>'
def text(x,z,t,size=13,fill='#cfe',anchor='middle',weight=400,**a):
    X,Y=px(x,z);attrs=' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items());return f'<text x="{X:.1f}" y="{Y:.1f}" font-size="{size}" fill="{fill}" text-anchor="{anchor}" font-weight="{weight}" {attrs}>{html.escape(t)}</text>'
def line(x0,z0,x1,z1,**a):
    A=px(x0,z0);B=px(x1,z1);attrs=' '.join(f'{k.replace("_","-")}="{v}"' for k,v in a.items());return f'<line x1="{A[0]:.1f}" y1="{A[1]:.1f}" x2="{B[0]:.1f}" y2="{B[1]:.1f}" {attrs}/>'
el=[]
# grid every 5 m
for gx in range(-20,51,5):
    el.append(line(gx,8.5,gx,82,stroke='#16233a',stroke_width=1))
for gz in range(10,83,5):
    el.append(line(-24,gz,50,gz,stroke='#16233a',stroke_width=1))
# rooms (fills) -- extents come from the wall solids
def room(name,x0,z0,x1,z1,fill,stroke):
    el.append(rect(x0,z0,x1,z1,fill=fill,stroke=stroke,stroke_width=1.5,fill_opacity=.9))
# alley / street
el.append(rect(-24,8.5,50,20,fill='#0b1426',stroke='none'))
el.append(rect(-3,8.5,3,20,fill='#0f1d34',stroke='none'))
# hall + vestibule
room('vestibule',-3,20,3,26,'#1c2b45','#5de0ff')
room('hall',-3,26,3,78,'#12243b','#2fe0c4')
# west side
vr=box('vr-north'),box('vr-south'),box('vr-west');room('vr',-17,28,-3,44,'#1b1535','#b86bff')
room('vend',-7,46.5,-3,52.5,'#14283a','#6cff9e')
room('pods',-17,55,-3,70,'#2a1230','#ff5bd0')
# east side
room('bar',3,28,17,42,'#2c2410','#ffb347')
room('admin',3,43,17,53,'#12203a','#9b7bff')
room('meeting',3,56,15,69,'#102a30','#e8f0ff')
# upper level terrace (dashed)
el.append(rect(28,58,48,78,fill='#101b2c',stroke='#7fa8c9',stroke_width=1.5,stroke_dasharray='6 5',fill_opacity=.8))
# walls from the game's own solids
wall_ids=[k for k in solids if any(k.startswith(p) for p in ('hall-','vestibule-','vr-north','vr-west','vr-south','vend-','pods-north','pods-west','pods-south','bar-north','bar-east','bar-south','shop-','meet-north','meet-east','meet-south','district-front'))]
for k in wall_ids:
    x0,z0,x1,z1=box(k)
    # thicken thin walls for legibility
    if x1-x0<.5:x0-=.1;x1+=.1
    if z1-z0<.5:z0-=.1;z1+=.1
    el.append(rect(x0,z0,x1,z1,fill='#9fb4cc',stroke='none'))
for k in ('terrace-north','terrace-west','terrace-east'):
    x0,z0,x1,z1=box(k);el.append(rect(x0-.1,z0-.1,x1+.1,z1+.1,fill='#7fa8c9',stroke='none',opacity=.8))
# doors
for k,c in (('district-door','#ffcf5a'),('district-inner-door','#35ff8f')):
    x0,z0,x1,z1=box(k);el.append(rect(x0,z0-.22,x1,z1+.22,fill=c,stroke='none'))
x0,z0,x1,z1=box('meeting-door');el.append(rect(x0-.2,z0,x1+.2,z1,fill='#e8f0ff',stroke='none',opacity=.9))
# furniture from solids
for k,c,lab in (('bar-counter','#ffb347',None),('shop-counter','#9b7bff',None),('meeting-table','#e8f0ff',None),('pods-row','#ff5bd0',None),('arcade-terminal','#b86bff',None),('vr-booth-glass','#d0b0ff',None),('vr-booth-partition','#d0b0ff',None)):
    x0,z0,x1,z1=box(k)
    if x1-x0<.3:x0-=.08;x1+=.08
    if z1-z0<.3:z0-=.08;z1+=.08
    el.append(rect(x0,z0,x1,z1,fill=c,stroke='none',opacity=.85))
# pod hatches (two stacked rows along the west wall)
for z in [56.8+i*2.4 for i in range(5)]:   # the game builds 5 pods along the wall, in 2 stacked rows (10 capsules)
    el.append(rect(-14.1,z,-13.5,z+1.9,fill='none',stroke='#ff9be6',stroke_width=1.5,rx=2))
# vending machines
for z in (47.5,49.5,51.5):
    el.append(rect(-7,z-.55,-6.4,z+.55,fill='#6cff9e',stroke='none',opacity=.9))
# music screen on the pods' south wall
el.append(rect(-10.7,69.75,-7.3,70.05,fill='#2fe0c4',stroke='none'))
# stairs at the end of the hall
for i in range(6): el.append(line(-2.4,77.4-i*.55,2.4,77.4-i*.55,stroke='#cfe',stroke_width=1.2,opacity=.7))
el.append(text(3.5,66.5,'door',10,'#cfd8e6',anchor='start'))
# room labels
el.append(text(0,14.2,'NEOCHINATOWN ALLEY',15,'#7fb2e5',weight=700,letter_spacing=2))
el.append(text(0,16.3,'(outside the District)',12,'#6e86a3'))
el.append(text(-12.5,30.2,'VR ARCADE',14,'#d6b8ff',weight=700))
el.append(text(-12.8,31.9,'glass booths',11,'#a58fcf'))
el.append(text(-12.8,33.3,'and arcade terminal',11,'#a58fcf'))
el.append(text(-5,45.4,'VENDING',11,'#9dffc0',weight=700))
el.append(text(-9,57.3,'SLEEPING PODS',14,'#ffb0ec',weight=700))
el.append(text(-8.2,58.8,'10 pods: 2 rows of 5',10.5,'#c98bb8'))
el.append(text(10,30.2,'BAR',14,'#ffd48a',weight=700))
el.append(text(10,45,'ADMIN & IRIS DESK  /  SHOP',13,'#c9b8ff',weight=700))
el.append(text(9,58,'MEETING ROOM',14,'#e8f0ff',weight=700))
el.append(text(9,59.8,'private',11,'#9fb0c8'))
el.append(text(38,60.6,'SMOKING TERRACE',13,'#a9c8e6',weight=700))
el.append(text(38,62,'upper level',11,'#8aa8c4'))
el.append(text(38,63.5,'not walkable from the hall: the stairs (11)',11,'#8aa8c4'))
el.append(text(38,65,'carry you here, and back (12)',11,'#8aa8c4'))
el.append(text(0,60,'HALL',13,'#58f0d8',weight=700,transform=f'rotate(-90 {px(0,60)[0]:.1f} {px(0,60)[1]:.1f})',letter_spacing=6))
el.append(text(0,23.2,'VESTIBULE',9.5,'#9be8ff',weight=700))
# door labels
el.append(text(5.2,19.6,'outer door',11,'#ffcf5a',anchor='start'))
el.append(text(5.2,26.5,'inner door',11,'#35ff8f',anchor='start'))
el.append(text(-5.6,19.6,'6 m wide',10,'#a58a3a',anchor='end'))
# spawn
sx,sz=px(0,17)
el.append(f'<g><circle cx="{sx:.1f}" cy="{sz:.1f}" r="7" fill="#ffffff"/><polygon points="{sx-8:.1f},{sz+8:.1f} {sx+8:.1f},{sz+8:.1f} {sx:.1f},{sz+22:.1f}" fill="#ffffff"/></g>')
el.append(text(-1.2,17.3,'new campaigns start here',12,'#fff',anchor='end',weight=700))
# numbered interaction points
pts=[('district-scan',1),('admin',2),('district-iris',3),('district-shop',4),('district-bar',5),('district-vr',6),('district-vending',7),('district-pod',8),('district-pod-music',9),('district-meeting',10),('district-stairs',11),('district-stairs-down',12)]
for iid,n in pts:
    x,z,_=inter[iid];X,Y=px(x,z)
    el.append(f'<g><circle cx="{X:.1f}" cy="{Y:.1f}" r="11" fill="#06101c" stroke="#ffcf5a" stroke-width="2"/><text x="{X:.1f}" y="{Y+4.5:.1f}" font-size="13" text-anchor="middle" fill="#ffcf5a" font-weight="700">{n}</text></g>')
# scale bar and compass
bx,by=px(-23,80.5);el.append(f'<line x1="{bx:.1f}" y1="{by:.1f}" x2="{bx+10*S:.1f}" y2="{by:.1f}" stroke="#cfe" stroke-width="3"/><text x="{bx+5*S:.1f}" y="{by-8:.1f}" font-size="12" fill="#cfe" text-anchor="middle">10 metres</text>')
ax,ay=px(30,11.5);el.append(f'<g><line x1="{ax:.1f}" y1="{ay+34:.1f}" x2="{ax:.1f}" y2="{ay-10:.1f}" stroke="#cfe" stroke-width="2"/><polygon points="{ax-6:.1f},{ay-4:.1f} {ax+6:.1f},{ay-4:.1f} {ax:.1f},{ay-18:.1f}" fill="#cfe"/><text x="{ax:.1f}" y="{ay+52:.1f}" font-size="11" fill="#cfe" text-anchor="middle">the street is at the top</text></g>')
legend_items=[
 (1,'Security scanner','present your badge (vestibule)'),(2,'Admin','speak with Admin'),(3,'Iris','the in-game Iris (not the website chat)'),
 (4,'Shop','browse the shop'),(5,'Bartender','talk to the bartender'),(6,'VR Play','access the VR experiences'),
 (7,'Vending machines','three machines'),(8,'Sleeping pods','10 capsules, two stacked rows of five; rest and save'),(9,'Pod music screen','wall-mounted player, plays your own songs'),
 (10,'Meeting room','private meeting room'),(11,'Stairs up','carries you up to the smoking terrace'),(12,'Stairs down','carries you back to the end of the hall')]
lx,ly=1110,PY
leg=[f'<text x="{lx}" y="{ly-8}" font-size="15" fill="#ffcf5a" font-weight="700" letter-spacing="2">WHAT YOU CAN DO</text>']
for i,(n,a,b) in enumerate(legend_items):
    y=ly+24+i*44
    leg.append(f'<circle cx="{lx+11}" cy="{y}" r="11" fill="#06101c" stroke="#ffcf5a" stroke-width="2"/><text x="{lx+11}" y="{y+4.5}" font-size="13" text-anchor="middle" fill="#ffcf5a" font-weight="700">{n}</text><text x="{lx+32}" y="{y-2}" font-size="14" fill="#e8f4f6" font-weight="700">{html.escape(a)}</text><text x="{lx+32}" y="{y+15}" font-size="12" fill="#8fa9bd">{html.escape(b)}</text>')
ly2=ly+24+12*44+14
leg.append(f'<text x="{lx}" y="{ly2}" font-size="15" fill="#2fe0c4" font-weight="700" letter-spacing="2">HOW TO READ IT</text>')
notes=['Plan view from above. The street is at the top.','Walking in from the street: VR arcade, vending','and the sleeping pods are on your LEFT;','the bar, Admin and Iris desk, shop and the','meeting room are on your RIGHT.','Yellow = outer door, green = inner door.','Grid squares are 5 metres.','Drawn from the game\'s own wall and','interaction data, so positions are exact.']
for i,t in enumerate(notes): leg.append(f'<text x="{lx}" y="{ly2+22+i*18}" font-size="12.5" fill="#a9c0d0">{html.escape(t)}</text>')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" font-family="Consolas, 'Courier New', monospace">
<rect width="{W}" height="{H}" fill="#070b14"/>
<text x="40" y="58" font-size="34" fill="#e4e4e4" font-weight="700" letter-spacing="6">THE DARKNET DISTRICT</text>
<text x="40" y="88" font-size="15" fill="#2fe0c4" letter-spacing="3">FLOOR PLAN  /  NEOCHINATOWN, TESSALY SYSTEM</text>
<text x="40" y="112" font-size="13" fill="#7f97a8">A security vestibule with two doors, then one hall about 52 metres long with rooms off both sides.</text>
{''.join(el)}
{''.join(leg)}
</svg>'''
open('darknet-district-map.svg','w').write(svg)
print('ok',len(svg))
