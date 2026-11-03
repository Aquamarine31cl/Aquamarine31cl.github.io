/* Layered atmosphere. Native Canvas 2D; no runtime CDN or animation framework. */
(() => {
'use strict';
if(document.getElementById('cosmic-moving-stars'))return;
const html=document.documentElement;
const canvas=document.createElement('canvas');canvas.id='cosmic-moving-stars';canvas.className='cosmic-moving-stars';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
const controls=document.createElement('div');controls.className='cosmic-motion-controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Background atmosphere');
const play=document.createElement('button');play.type='button';play.className='cosmic-background-toggle';
const quality=document.createElement('button');quality.type='button';quality.className='cosmic-atmosphere-toggle';controls.append(play,quality);document.body.append(controls);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');const fine=matchMedia('(hover: hover) and (pointer: fine)');
const read=key=>{try{return localStorage.getItem(key);}catch(e){return null;}};
const save=(key,value)=>{try{localStorage.setItem(key,value);}catch(e){}};
let selection=read('aquamarine.background.motion');
let enabled=selection===null?!reduce.matches:selection==='play';
let atmosphere=read('aquamarine.background.atmosphere')||((innerWidth<700||(navigator.hardwareConcurrency||4)<4)?'calm':'rich');
let width=0,height=0,stars=[],frame=0,previous=0,elapsed=0,drawn=0;
let pointer={x:0,y:0,active:false},camera={x:0,y:0};
const glow=document.createElement('canvas');glow.width=32;glow.height=32;const g=glow.getContext('2d');
const starGradient=g.createRadialGradient(16,16,0,16,16,16);starGradient.addColorStop(0,'rgba(244,239,255,1)');starGradient.addColorStop(.13,'rgba(213,202,255,.85)');starGradient.addColorStop(.38,'rgba(158,191,255,.2)');starGradient.addColorStop(1,'rgba(158,191,255,0)');g.fillStyle=starGradient;g.fillRect(0,0,32,32);
const haze=document.createElement('canvas');haze.width=900;haze.height=600;const hc=haze.getContext('2d');
for(const [x,y,r,color] of [[170,160,300,'151,96,232'],[750,330,330,'65,178,195'],[440,550,280,'192,99,178']]){const grad=hc.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,'rgba('+color+',.16)');grad.addColorStop(.5,'rgba('+color+',.06)');grad.addColorStop(1,'rgba('+color+',0)');hc.fillStyle=grad;hc.fillRect(0,0,900,600);}

const galaxy=document.createElement('canvas');galaxy.width=1600;galaxy.height=1000;const gc=galaxy.getContext('2d');
let seed=7193;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const normal=()=>Math.sqrt(-2*Math.log(Math.max(.0001,random())))*Math.cos(2*Math.PI*random());
for(let i=0;i<35;i++){
 const x=random()*1900-150,y=680-x*.34+normal()*58,r=55+random()*135;
 const gradient=gc.createRadialGradient(x,y,0,x,y,r);
 const color=i%3===0?'99,188,222':i%3===1?'172,137,230':'218,161,205';
 gradient.addColorStop(0,'rgba('+color+',.045)');gradient.addColorStop(1,'rgba('+color+',0)');
 gc.fillStyle=gradient;gc.fillRect(x-r,y-r,r*2,r*2);
}
for(let i=0;i<12000;i++){
 const x=random()*1800-100,y=680-x*.34+normal()*(25+random()*75);
 gc.globalAlpha=.07+random()*.38;
 gc.fillStyle=i%4===0?'#b3daf2':i%4===1?'#f0d8c6':'#dbd2ef';
 const r=.25+random()*.7;gc.fillRect(x,y,r,r);
}
gc.globalAlpha=1;

function resize(){
width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,width<700?1.5:2.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
const count=atmosphere==='rich'?(width<700?90:Math.min(560,Math.round(width*height/5000)+180)):(width<700?40:130);
stars=Array.from({length:count},(_,i)=>({x:((i*137.508+53)%997)/997,y:((i*89.317+37)%991)/991,depth:[.18,.38,.65,1][i%4],radius:.55+(i%5)*.24,phase:i*1.73}));
draw();}
function draw(){
ctx.clearRect(0,0,width,height);
if(atmosphere==='rich'){ctx.globalAlpha=.9;ctx.drawImage(haze,-width*.08+Math.sin(elapsed*.08)*24-camera.x*8,-height*.08+Math.cos(elapsed*.07)*18-camera.y*6,width*1.16,height*1.16);}
if(atmosphere==='rich'){ctx.globalCompositeOperation='screen';ctx.globalAlpha=.85;ctx.drawImage(galaxy,-width*.08+Math.sin(elapsed*.025)*18-camera.x*12,-height*.08+Math.cos(elapsed*.022)*15-camera.y*10,width*1.16,height*1.16);ctx.globalCompositeOperation='source-over';}
const positions=[];
for(const star of stars){const depth=star.depth;let x=((star.x*width+elapsed*(1.2+depth*5.5)+camera.x*depth*24+48)%(width+96))-48;let y=star.y*height+Math.sin(elapsed*.12+star.phase)*5+camera.y*depth*19;
if(pointer.active&&fine.matches&&enabled){const dx=x-(pointer.x+1)*width*.5,dy=y-(pointer.y+1)*height*.5,d=Math.hypot(dx,dy);if(d>1&&d<145){const influence=(1-d/145)*7*depth;x+=dx/d*influence;y+=dy/d*influence;}}
const alpha=.25+depth*.35+Math.sin(elapsed*(.6+depth*.35)+star.phase)*.14;ctx.globalAlpha=alpha;
if(depth>=.65){const size=star.radius*(depth===1?10:6);ctx.drawImage(glow,x-size/2,y-size/2,size,size);if(depth===1&&star.radius>1.2){ctx.strokeStyle='#e7e5ff';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x+3,y);ctx.moveTo(x,y-3);ctx.lineTo(x,y+3);ctx.stroke();}}else{ctx.fillStyle=depth<.5?'#b6b4dd':'#d8d2ec';ctx.beginPath();ctx.arc(x,y,star.radius,0,Math.PI*2);ctx.fill();}
if(pointer.active&&fine.matches)positions.push({x,y,depth});}
if(enabled&&atmosphere==='rich'&&pointer.active&&fine.matches){const px=(pointer.x+1)*width*.5,py=(pointer.y+1)*height*.5;const nearby=positions.filter(p=>p.depth>.3&&Math.hypot(p.x-px,p.y-py)<190).slice(0,12);let lines=0;
for(let i=0;i<nearby.length;i++)for(let j=i+1;j<nearby.length&&lines<18;j++){const a=nearby[i],b=nearby[j],distance=Math.hypot(a.x-b.x,a.y-b.y);if(distance<115){ctx.globalAlpha=(1-distance/115)*.24;ctx.strokeStyle='#b7c8f3';ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();lines++;}}}
if(enabled&&atmosphere==='rich')for(const [period,offset,lane] of [[13,3,.18],[19,11,.42],[29,6,.68]]){const phase=(elapsed+offset)%period;if(phase<1.35){const x=width*(.14+phase*.52),y=height*lane+phase*90;const gradient=ctx.createLinearGradient(x-130,y-50,x,y);gradient.addColorStop(0,'rgba(176,195,255,0)');gradient.addColorStop(1,'rgba(232,239,255,.85)');ctx.globalAlpha=Math.sin(phase/1.35*Math.PI)*.8;ctx.strokeStyle=gradient;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x-130,y-50);ctx.lineTo(x,y);ctx.stroke();}}
ctx.globalAlpha=1;
}
function active(){return enabled&&!document.hidden&&html.dataset.theme==='dark';}
function tick(now){frame=0;if(!active())return;frame=requestAnimationFrame(tick);if(width<700&&now-drawn<1000/40)return;const delta=Math.min((now-previous)/1000,.08);previous=now;drawn=now;elapsed+=delta;const ease=1-Math.exp(-delta*3.5);camera.x+=(pointer.x-camera.x)*ease;camera.y+=(pointer.y-camera.y)*ease;draw();}
function sync(){
html.dataset.backgroundMotion=enabled?'running':'paused';html.dataset.atmosphere=atmosphere;
play.textContent=enabled?'Pause Background':'Play Background';play.setAttribute('aria-pressed',String(enabled));
quality.textContent='Atmosphere: '+(atmosphere==='rich'?'Rich':'Calm');quality.setAttribute('aria-pressed',String(atmosphere==='rich'));
if(frame){cancelAnimationFrame(frame);frame=0;}if(active()){previous=performance.now();drawn=0;frame=requestAnimationFrame(tick);}else draw();}
play.addEventListener('click',()=>{enabled=!enabled;selection=enabled?'play':'pause';save('aquamarine.background.motion',selection);sync();});
quality.addEventListener('click',()=>{atmosphere=atmosphere==='rich'?'calm':'rich';save('aquamarine.background.atmosphere',atmosphere);resize();sync();});
addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!fine.matches||!enabled||reduce.matches)return;pointer={x:event.clientX/width*2-1,y:event.clientY/height*2-1,active:true};},{passive:true});
document.addEventListener('pointerleave',()=>{pointer={x:0,y:0,active:false};});addEventListener('blur',()=>{pointer={x:0,y:0,active:false};});
addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',sync);
reduce.addEventListener('change',()=>{if(selection===null)enabled=!reduce.matches;pointer={x:0,y:0,active:false};sync();});
addEventListener('pageshow',sync);addEventListener('pagehide',()=>{if(frame)cancelAnimationFrame(frame);frame=0;});
new MutationObserver(sync).observe(html,{attributes:true,attributeFilter:['data-theme']});resize();sync();
})();
