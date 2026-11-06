/* Patched-conic orbital flight with fixed-step velocity Verlet integration. */
(() => {
'use strict';
class KeplerCourier{
 constructor(){this.reset();}
 reset(){this.mu=12000;this.planet=55;this.time=0;this.fuel=180;this.hull=100;this.stage=0;this.phase='ready';this.paused=false;this.angle=Math.PI/2;this.ship={x:160,y:0,vx:0,vy:Math.sqrt(this.mu/160)};this.trail=[];this.message='Launch from the inner orbit. Transfer to the marked station and match its velocity.';}
 target(at=this.time){const index=Math.min(this.stage,2),radius=[220,290,360][index],omega=Math.sqrt(this.mu/radius**3),theta=.85+index*1.3+at*omega;return{x:radius*Math.cos(theta),y:radius*Math.sin(theta),vx:-radius*omega*Math.sin(theta),vy:radius*omega*Math.cos(theta),radius};}
 gravity(x,y){const r=Math.hypot(x,y);return{x:-this.mu*x/r**3,y:-this.mu*y/r**3};}
 integrate(body,dt,ax=0,ay=0){const a=this.gravity(body.x,body.y);body.x+=body.vx*dt+.5*(a.x+ax)*dt*dt;body.y+=body.vy*dt+.5*(a.y+ay)*dt*dt;const b=this.gravity(body.x,body.y);body.vx+=(a.x+b.x+2*ax)*dt*.5;body.vy+=(a.y+b.y+2*ay)*dt*.5;}
 orbit(){const s=this.ship,r=Math.hypot(s.x,s.y),v2=s.vx*s.vx+s.vy*s.vy,energy=v2/2-this.mu/r,h=s.x*s.vy-s.y*s.vx,e=Math.sqrt(Math.max(0,1+2*energy*h*h/this.mu**2)),a=-this.mu/(2*energy);return{periapsis:a*(1-e),apoapsis:energy<0?a*(1+e):Infinity,energy};}
 transfer(){const r=Math.hypot(this.ship.x,this.ship.y),R=this.target().radius;return{first:Math.sqrt(this.mu/r)*(Math.sqrt(2*R/(r+R))-1),second:Math.sqrt(this.mu/R)*(1-Math.sqrt(2*r/(r+R))),duration:Math.PI*Math.sqrt(((r+R)/2)**3/this.mu)};}
 step(dt,input={}){
  if(this.phase!=='flight'||this.paused)return;
  this.angle+=(Number(!!input.right)-Number(!!input.left))*1.1*dt;
  const thrust=input.thrust&&this.fuel>0?(input.precision?.275:1.1):0;
  if(thrust)this.fuel=Math.max(0,this.fuel-dt*1.8*(input.precision?.25:1));
  this.integrate(this.ship,dt,Math.cos(this.angle)*thrust,Math.sin(this.angle)*thrust);this.time+=dt;
  const r=Math.hypot(this.ship.x,this.ship.y),t=this.target(),distance=Math.hypot(this.ship.x-t.x,this.ship.y-t.y),relative=Math.hypot(this.ship.vx-t.vx,this.ship.vy-t.vy);
  if(r<65||r>650){this.phase='lost';this.message=r<65?'Atmospheric impact. Raise your periapsis above 65.':'Spacecraft lost beyond the navigation boundary.';return;}
  if(distance<12&&relative>8){this.hull-=relative*dt*4;if(this.hull<=0){this.phase='lost';this.message='High-speed docking collision. Match velocity before approach.';return;}}
  if(distance<15&&relative<1.8){this.stage++;this.fuel=Math.min(180,this.fuel+90);this.hull=Math.min(100,this.hull+20);if(this.stage===3){this.phase='won';this.message='Three deliveries complete. Kepler Courier certified.';}else{this.phase='docked';this.message='Cargo delivered. Refueled and repaired. Launch for the next orbit.';}}
 }
 predict(){const body={...this.ship},points=[];for(let i=0;i<320;i++){this.integrate(body,.7);if(i%4===0)points.push({x:body.x,y:body.y});if(Math.hypot(body.x,body.y)<62||Math.hypot(body.x,body.y)>650)break;}return points;}
}
globalThis.KeplerCourier=KeplerCourier;
const root=typeof document!=='undefined'?document.querySelector('[data-kepler]'):null;if(!root)return;
const game=new KeplerCourier(),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d'),keys={},controls=root.querySelectorAll('[data-kepler-control]');let previous=0,accumulator=0,visible=false,predict=[],predictionTick=0,raf=0,timeScale=1;
const project=(x,y)=>({x:480+x,y:400+y});
function draw(){
 ctx.clearRect(0,0,960,800);ctx.fillStyle='#080f22';ctx.fillRect(0,0,960,800);ctx.save();const zoom=Math.min(1,370/Math.max(370,Math.hypot(game.ship.x,game.ship.y)));ctx.translate(480,400);ctx.scale(zoom,zoom);ctx.translate(-480,-400);const planet=ctx.createRadialGradient(463,382,5,480,400,55);planet.addColorStop(0,'#83c7e3');planet.addColorStop(.5,'#1f5c83');planet.addColorStop(1,'#0c1d34');ctx.fillStyle=planet;ctx.beginPath();ctx.arc(480,400,55,0,Math.PI*2);ctx.fill();
 for(const radius of [160,220,290,360]){ctx.strokeStyle='#4d6b8f55';ctx.lineWidth=1;ctx.beginPath();ctx.arc(480,400,radius,0,Math.PI*2);ctx.stroke();}
 ctx.strokeStyle='#afc6fb80';ctx.setLineDash([4,6]);ctx.beginPath();predict.forEach((p,i)=>{const a=project(p.x,p.y);i?ctx.lineTo(a.x,a.y):ctx.moveTo(a.x,a.y);});ctx.stroke();ctx.setLineDash([]);
 const t=game.target(),a=project(t.x,t.y);ctx.strokeStyle='#ffe3a1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(a.x,a.y,15,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ffe3a1';ctx.font='13px sans-serif';ctx.fillText('DOCK '+Math.min(3,game.stage+1),a.x-23,a.y-23);
 const s=game.ship,p=project(s.x,s.y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(game.angle);ctx.fillStyle='#d2fff1';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,6);ctx.lineTo(-4,0);ctx.lineTo(-7,-6);ctx.closePath();ctx.fill();if(keys.thrust&&game.fuel>0&&game.phase==='flight'&&!game.paused){ctx.fillStyle='#f4bd77';ctx.beginPath();ctx.moveTo(-7,-3);ctx.lineTo(-18,0);ctx.lineTo(-7,3);ctx.fill();}ctx.restore();
 ctx.restore();const o=game.orbit(),distance=Math.hypot(s.x-t.x,s.y-t.y),speed=Math.hypot(s.vx-t.vx,s.vy-t.vy),transfer=game.transfer();
 root.querySelector('[data-kepler-hud]').textContent=`Delivery ${game.stage}/3 · Fuel ${game.fuel.toFixed(0)} · Hull ${Math.max(0,game.hull).toFixed(0)}% · Range ${distance.toFixed(0)} · Relative speed ${speed.toFixed(1)}`;
 root.querySelector('[data-kepler-telemetry]').textContent=`Periapsis ${o.periapsis.toFixed(0)} · Apoapsis ${Number.isFinite(o.apoapsis)?o.apoapsis.toFixed(0):'escape'} · Transfer estimate: Δv ${transfer.first.toFixed(2)} then ${transfer.second.toFixed(2)}; coast ${transfer.duration.toFixed(0)} s. Dashed line: unpowered trajectory.`;
 root.querySelector('[data-kepler-status]').textContent=game.paused?'Flight paused.':game.message;
 root.querySelector('[data-kepler-pause]').textContent=game.paused?'Resume Courier':'Pause Courier';root.querySelector('[data-kepler-pause]').disabled=game.phase!=='flight';
}
function release(){for(const key in keys)keys[key]=false;controls.forEach(b=>b.setAttribute('aria-pressed','false'));}
function sync(){cancelAnimationFrame(raf);raf=0;previous=performance.now();accumulator=0;draw();if(visible&&!document.hidden&&game.phase==='flight'&&!game.paused)raf=requestAnimationFrame(frame);}
function pause(){if(game.phase==='flight'){game.paused=true;release();sync();}}
root.querySelector('[data-kepler-start]').addEventListener('click',()=>{if(game.phase!=='ready'&&game.phase!=='docked')game.reset();game.phase='flight';game.paused=false;game.message='Dock within 15 units at relative speed below 1.8. Keep periapsis above 65.';accumulator=0;predict=game.predict();sync();});
root.querySelector('[data-kepler-pause]').addEventListener('click',()=>{game.paused=!game.paused;release();sync();});
root.querySelector('[data-kepler-speed]').addEventListener('change',e=>{timeScale=Number(e.target.value);accumulator=0;});
root.querySelector('[data-kepler-align]').addEventListener('click',()=>{game.angle=Math.atan2(game.ship.vy,game.ship.vx);draw();});
root.querySelector('[data-kepler-retro]').addEventListener('click',()=>{game.angle=Math.atan2(game.ship.vy,game.ship.vx)+Math.PI;draw();});
for(const b of controls){const set=v=>{keys[b.dataset.keplerControl]=v;b.setAttribute('aria-pressed',String(v));};b.addEventListener('pointerdown',e=>{if(e.button!==0)return;b.setPointerCapture(e.pointerId);set(true);});['pointerup','pointercancel','lostpointercapture'].forEach(type=>b.addEventListener(type,()=>set(false)));b.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();set(true);}});b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter')set(false);});b.addEventListener('blur',()=>set(false));}
canvas.addEventListener('keydown',e=>{const key={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'thrust',w:'thrust',' ':'thrust',Shift:'precision'}[e.key.length===1?e.key.toLowerCase():e.key];if(key){e.preventDefault();keys[key]=true;}if(!e.repeat&&['q','e'].includes(e.key.toLowerCase())){e.preventDefault();game.angle=Math.atan2(game.ship.vy,game.ship.vx)+(e.key.toLowerCase()==='e'?Math.PI:0);draw();}if(e.key.toLowerCase()==='p'&&!e.repeat){game.paused=!game.paused;release();sync();}});canvas.addEventListener('keyup',e=>{const key={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'thrust',w:'thrust',' ':'thrust'}[e.key.length===1?e.key.toLowerCase():e.key];if(key){e.preventDefault();keys[key]=false;}});canvas.addEventListener('blur',release);window.addEventListener('blur',pause);window.addEventListener('pagehide',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(!visible)pause();else sync();},{threshold:.1}).observe(canvas);
function frame(now){raf=0;const elapsed=Math.min(.05,(now-previous)/1000||0);previous=now;if(visible&&!document.hidden&&game.phase==='flight'&&!game.paused){accumulator+=elapsed*timeScale;while(accumulator>=1/120){game.step(1/120,keys);accumulator-=1/120;}if(++predictionTick%12===0)predict=game.predict();draw();}if(visible&&!document.hidden&&game.phase==='flight'&&!game.paused)raf=requestAnimationFrame(frame);}predict=game.predict();draw();
})();


