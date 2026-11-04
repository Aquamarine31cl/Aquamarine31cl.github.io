/* A bounded, optional experiment. No global pointer tracking or background loop. */
(() => {
'use strict';
const dialog=document.querySelector('.sky-atlas-dialog');
if(!dialog||dialog.querySelector('.pocket-observatory'))return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const panel=document.createElement('section');panel.className='pocket-observatory';
panel.innerHTML='<h3>Pocket Observatory</h3><p>Two stars share a centre of gravity. Send a comet to each of the three distant lights.</p><canvas width="560" height="220" tabindex="0" role="img" aria-label="Interactive binary stars. Click a distant light, or use Send a Comet."></canvas><div class="observatory-actions"><button type="button" data-comet>Send a Comet</button><button type="button" data-pause aria-pressed="false">Pause Observatory</button></div><p class="observatory-status" role="status">Three little lights are waiting.</p>';
dialog.append(panel);
const canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d');
if(!ctx){panel.remove();return;}
const status=panel.querySelector('.observatory-status'),pause=panel.querySelector('[data-pause]');
const targets=[{x:90,y:64},{x:280,y:42},{x:470,y:64}],found=new Set();
const signal=document.createElement('button');
signal.type='button';
signal.textContent='Decode the Signal';
signal.hidden=true;
panel.querySelector('.observatory-actions').append(signal);
const chart=document.createElement('button');
chart.type='button';
chart.textContent='Reveal the Star Chart';
chart.hidden=true;
chart.setAttribute('aria-pressed','false');
panel.querySelector('.observatory-actions').append(chart);
let chartStart=0;
chart.addEventListener('click',()=>{
 const open=panel.toggleAttribute('data-chart');
 chartStart=time;
 chart.setAttribute('aria-pressed',String(open));
 chart.textContent=open?'Hide the Star Chart':'Reveal the Star Chart';
 status.textContent=open?'Secret Chart discovered. Three stars guide the way home.':'The harbor sky is clear again.';
 draw();
});
signal.addEventListener('click',()=>{
 if(panel.hasAttribute('data-signal')){
  if(panel.hasAttribute('data-beacon')){
   if(reduce.matches){arrive();draw();return;}
   relayStart=time;
   echoStart=-Infinity;
   status.textContent=paused?'The harbor light is ready to sail.':'A harbor light is answering.';
   draw();
   return;
  }
  panel.dataset.beacon='';
  status.textContent='Quiet Harbor discovered. The beacon has drawn a path home.';
  signal.textContent='Send a Harbor Light';
  draw();
  return;
 }
 panel.dataset.signal='';
 status.textContent='Aurora Relay unlocked. Somewhere in the dark, a little light answers.';
 signal.textContent='Follow the Beacon';
 draw();
});
let frame=0,last=0,time=0,comets=[],paused=false,visible=true,lastLaunch=-Infinity;
let relayStart=-Infinity;
let echoStart=-Infinity;
const relayPath=[[280,110],[90,64],[280,42],[470,64],[280,110]];
const relayDuration=2.8;
function arrive(){
 relayStart=-Infinity;
 echoStart=reduce.matches?-Infinity:time;
 panel.dataset.echo='';
 chart.hidden=false;
 status.textContent='Harbor Echo discovered. The light has returned home.';
}
const active=()=>dialog.open&&!document.hidden&&visible&&!paused&&!reduce.matches;
function star(x,y,r,color,alpha=1){ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x,y,0,x,y,r*5);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r*5,y-r*5,r*10,r*10);ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
function draw(){
 ctx.clearRect(0,0,560,220);
 if(panel.hasAttribute('data-signal')){
  const glow=ctx.createLinearGradient(0,10,0,130);
  glow.addColorStop(0,'transparent');
  glow.addColorStop(.48,'#65f4ce55');
  glow.addColorStop(1,'transparent');
  ctx.fillStyle=glow;
  ctx.beginPath();
  ctx.moveTo(0,58);
  const drift=Math.sin(time)*10;
  ctx.bezierCurveTo(145,10+drift,390,110-drift,560,42);
  ctx.lineTo(560,89);
  ctx.bezierCurveTo(390,153-drift,145,52+drift,0,101);
  ctx.fill();
 }
 ctx.fillStyle='#bbcbe7';
 for(let i=0;i<40;i++){
  ctx.globalAlpha=.25+.12*Math.sin(time+i);
  ctx.fillRect(12+(i*137)%535,12+(i*79)%195,1.2,1.2);
 }
 ctx.globalAlpha=1;
 if(panel.hasAttribute('data-chart')){
  const opacity=reduce.matches||paused?1:Math.min(1,.2+(time-chartStart)*2);
  ctx.globalAlpha=opacity;
  ctx.fillStyle='#e2fff2';
  ctx.font='bold 16px system-ui, sans-serif';
  ctx.textAlign='center';
  targets.forEach((target,index)=>ctx.fillText(String(index+1),target.x,target.y-18));
  ctx.fillText('HOME',280,135);
  ctx.globalAlpha=1;
 }
 if(panel.hasAttribute('data-beacon')){
  ctx.strokeStyle='#85ecd1';
  ctx.globalAlpha=.65+.18*Math.sin(time*2);
  ctx.lineWidth=1;
  ctx.beginPath();
  ctx.moveTo(90,64);ctx.lineTo(280,42);ctx.lineTo(470,64);
  ctx.lineTo(280,110);ctx.closePath();ctx.stroke();
  ctx.globalAlpha=1;
  star(280,110,3,'#a6ffdc');
  if(panel.hasAttribute('data-echo')){
   const echo=time-echoStart;
   ctx.strokeStyle='#a6ffdc';
   ctx.lineWidth=1;
   for(let i=0;i<2;i++){
    const phase=echo-i*.22;
    if(phase<0||phase>=1)continue;
    ctx.globalAlpha=.65*(1-phase);
    ctx.beginPath();ctx.arc(280,110,6+phase*30,0,Math.PI*2);ctx.stroke();
   }
   ctx.globalAlpha=1;
   star(280,110,4,'#e2fff2');
  }
  const progress=(time-relayStart)/.7;
  if(progress>=0&&progress<4){
   const segment=Math.floor(progress);
   const fraction=progress-segment;
   const [x1,y1]=relayPath[segment];
   const [x2,y2]=relayPath[segment+1];
   star(x1+(x2-x1)*fraction,y1+(y2-y1)*fraction,3.5,'#e2fff2');
  }
 }
 targets.forEach((p,i)=>{star(p.x,p.y,found.has(i)?3:2,found.has(i)?'#ffe4ad':'#b9bbd9');ctx.strokeStyle='#b8b9e333';ctx.beginPath();ctx.arc(p.x,p.y,12,0,Math.PI*2);ctx.stroke();});
 const angle=time*.65,cx=280,cy=145;
 ctx.strokeStyle='#bbacdf44';ctx.beginPath();ctx.ellipse(cx,cy,62,26,0,0,Math.PI*2);ctx.stroke();
 // Opposite points and a 2:1 radius ratio keep the mass-weighted centre fixed.
 const x=Math.cos(angle),y=Math.sin(angle);
 star(cx+x*31,cy+y*13,5,'#b9edff');star(cx-x*62,cy-y*26,3.5,'#f3c2f5');
 for(const c of comets){const t=Math.min(1,c.age/1.25),u=1-t;
  const point=v=>({x:280+(c.x-280)*v,y:198+(c.y-198)*v-90*4*v*(1-v)});
  const alpha=Math.min(1,u*5);
  const p=point(t);
  for(let i=0;i<12;i++){
   const a=point(Math.max(0,t-i*.014));
   const b=point(Math.max(0,t-(i+1)*.014));
   ctx.strokeStyle='#c8e7ff';
   ctx.globalAlpha=alpha*(1-i/12);
   ctx.lineWidth=2-i*.12;
   ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  star(p.x,p.y,2,'#e8eaff',alpha);
 }
 ctx.globalAlpha=1;
}
function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
function tick(now){frame=0;if(!active())return;const dt=last?Math.min((now-last)/1000,.04):0;last=now;time+=dt;
 if(time-relayStart>=relayDuration&&Number.isFinite(relayStart))arrive();
 comets.forEach(c=>c.age+=dt);comets=comets.filter(c=>c.age<1.25);draw();frame=requestAnimationFrame(tick);}
function sync(){stop();pause.textContent=paused?'Resume Observatory':'Pause Observatory';pause.setAttribute('aria-pressed',String(paused));pause.disabled=reduce.matches;draw();if(active())frame=requestAnimationFrame(tick);}
function launch(index){
 if(!dialog.open||document.hidden)return;const now=performance.now();if(now-lastLaunch<500)return;lastLaunch=now;
 const target=targets[index];found.add(index);
 if(!reduce.matches&&!paused)comets.push({...target,age:0});
 if(!panel.hasAttribute('data-signal'))status.textContent=found.size===3?'Celestial Navigator — a faint signal is coming through.':found.size+' / 3 distant lights reached.';
 if(found.size===3){panel.dataset.complete='';signal.hidden=false;}draw();
}
canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*560,y=(e.clientY-r.top)/r.height*220;let best=0;targets.forEach((p,i)=>{if(Math.hypot(p.x-x,p.y-y)<Math.hypot(targets[best].x-x,targets[best].y-y))best=i;});launch(best);});
const next=()=>launch(targets.findIndex((_,i)=>!found.has(i))<0?Math.floor(Math.random()*3):targets.findIndex((_,i)=>!found.has(i)));
panel.querySelector('[data-comet]').addEventListener('click',next);
canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)next();}});
pause.addEventListener('click',()=>{paused=!paused;sync();});
new MutationObserver(()=>{
 if(!dialog.open){
  comets=[];found.clear();lastLaunch=-Infinity;relayStart=-Infinity;echoStart=-Infinity;
  panel.removeAttribute('data-complete');
  panel.removeAttribute('data-signal');
  panel.removeAttribute('data-beacon');
  panel.removeAttribute('data-echo');
  panel.removeAttribute('data-chart');
  chart.hidden=true;
  chart.textContent='Reveal the Star Chart';
  chart.setAttribute('aria-pressed','false');
  signal.hidden=true;signal.disabled=false;
  signal.textContent='Decode the Signal';
  status.textContent='Three little lights are waiting.';
 }
 resizeCanvas();
 sync();
}).observe(dialog,{attributes:true,attributeFilter:['open']});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
function resizeCanvas(){
 const width=canvas.clientWidth;
 if(!width)return;
 const pixels=Math.max(1,Math.round(width*Math.min(window.devicePixelRatio||1,2)));
 if(pixels===canvas.width)return;
 canvas.width=pixels;
 canvas.height=Math.max(1,Math.round(pixels*220/560));
 ctx.setTransform(canvas.width/560,0,0,canvas.height/220,0,0);
 draw();
}
if('ResizeObserver' in window)new ResizeObserver(resizeCanvas).observe(canvas);
addEventListener('resize',resizeCanvas);
document.addEventListener('visibilitychange',sync);
reduce.addEventListener('change',()=>{
 comets=[];
 if(reduce.matches&&Number.isFinite(relayStart))arrive();
 echoStart=-Infinity;
 sync();
});
addEventListener('pagehide',()=>{stop();comets=[];});addEventListener('pageshow',sync);sync();
})();
