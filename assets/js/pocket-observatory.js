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
signal.addEventListener('click',()=>{
 panel.dataset.signal='';
 status.textContent='Aurora Relay unlocked. Somewhere in the dark, a little light answers.';
 signal.disabled=true;
 draw();
});
let frame=0,last=0,time=0,comets=[],paused=false,visible=true,lastLaunch=-Infinity;
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
 comets.forEach(c=>c.age+=dt);comets=comets.filter(c=>c.age<1.25);draw();frame=requestAnimationFrame(tick);}
function sync(){stop();pause.textContent=paused?'Resume Observatory':'Pause Observatory';pause.setAttribute('aria-pressed',String(paused));pause.disabled=reduce.matches;draw();if(active())frame=requestAnimationFrame(tick);}
function launch(index){
 if(!dialog.open||document.hidden)return;const now=performance.now();if(now-lastLaunch<500)return;lastLaunch=now;
 const target=targets[index];found.add(index);
 if(!reduce.matches&&!paused)comets.push({...target,age:0});
 if(!signal.disabled)status.textContent=found.size===3?'Celestial Navigator — a faint signal is coming through.':found.size+' / 3 distant lights reached.';
 if(found.size===3){panel.dataset.complete='';signal.hidden=false;}draw();
}
canvas.addEventListener('click',e=>{const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*560,y=(e.clientY-r.top)/r.height*220;let best=0;targets.forEach((p,i)=>{if(Math.hypot(p.x-x,p.y-y)<Math.hypot(targets[best].x-x,targets[best].y-y))best=i;});launch(best);});
const next=()=>launch(targets.findIndex((_,i)=>!found.has(i))<0?Math.floor(Math.random()*3):targets.findIndex((_,i)=>!found.has(i)));
panel.querySelector('[data-comet]').addEventListener('click',next);
canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)next();}});
pause.addEventListener('click',()=>{paused=!paused;sync();});
new MutationObserver(()=>{
 if(!dialog.open){
  comets=[];found.clear();lastLaunch=-Infinity;
  panel.removeAttribute('data-complete');
  panel.removeAttribute('data-signal');
  signal.hidden=true;signal.disabled=false;
  status.textContent='Three little lights are waiting.';
 }
 sync();
}).observe(dialog,{attributes:true,attributeFilter:['open']});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(canvas);
document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',()=>{comets=[];sync();});
addEventListener('pagehide',()=>{stop();comets=[];});addEventListener('pageshow',sync);sync();
})();
