(() => {
'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const names={scholar:'Scholar',nova:'Nova',voyager:'Voyager',dreamer:'Dreamer',creator:'Creator'};
let discovered=[];try{const saved=JSON.parse(localStorage.getItem('aquamarine.sky.collection.v1')||'[]');if(Array.isArray(saved))discovered=saved.filter(x=>Object.hasOwn(names,x));}catch{}
const toast=document.createElement('div');toast.className='sky-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');toast.hidden=true;document.body.append(toast);
const canvas=document.createElement('canvas');canvas.className='sky-celebration';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);const ctx=canvas.getContext('2d');
let particles=[],frame=0,last=0,timer=0;
function drawBadges(){
 document.querySelectorAll('[data-sky-count]').forEach(el=>el.textContent=discovered.length+' / 5');
 document.querySelectorAll('[data-sky-badges]').forEach(el=>{
  el.replaceChildren();for(const [id,name] of Object.entries(names)){const chip=document.createElement('span');chip.className=discovered.includes(id)?'sky-badge is-found':'sky-badge';chip.textContent=(discovered.includes(id)?'✦ ':'· ')+name;el.append(chip);}
 });
}
function stop(){cancelAnimationFrame(frame);frame=0;last=0;particles=[];ctx?.clearRect(0,0,canvas.width,canvas.height);}
function tick(now){
 frame=0;const dt=last?Math.min((now-last)/1000,.04):1/60;last=now;
 ctx.clearRect(0,0,canvas.width,canvas.height);
 particles=particles.filter(p=>p.life>0);
 for(const p of particles){
  p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.gravity*dt;
  const alpha=Math.max(0,Math.min(1,p.life/.8));ctx.globalAlpha=alpha;
  ctx.strokeStyle=p.color;ctx.lineWidth=p.r;ctx.beginPath();ctx.moveTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.lineTo(p.x,p.y);ctx.stroke();
 }
 ctx.globalAlpha=1;if(particles.length&&!document.hidden)frame=requestAnimationFrame(tick);else stop();
}
function celebrate(message,strong=false,origin){
 toast.textContent=message;toast.hidden=false;clearTimeout(timer);timer=setTimeout(()=>toast.hidden=true,3800);
 if(reduced.matches||document.hidden||!ctx)return;
 if(!frame){canvas.width=innerWidth;canvas.height=innerHeight;}
 const cx=origin?.x??innerWidth*.5,cy=origin?.y??innerHeight*.28;
 const available=140-particles.length;
 for(let i=0;i<Math.min(available,strong?90:45);i++){
  const a=Math.random()*Math.PI*2,speed=35+Math.random()*(strong?140:85);
  particles.push({x:cx,y:cy,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-35,gravity:12,life:1.5+Math.random()*1.5,r:.6+Math.random()*1.1,color:['#c9b4ff','#a9e3ee','#f2dca8'][i%3]});
 }
 if(message.includes('comet')||message.includes('meteor shower')){
  const count=message.includes('meteor shower')?8:1;
  for(let i=0;i<count;i++)particles.push({x:innerWidth*(.05+Math.random()*.55),y:innerHeight*(.05+Math.random()*.3),vx:350+Math.random()*140,vy:100+Math.random()*100,gravity:0,life:1.6+Math.random(),r:1.2,color:'#e4ddff'});
 }
 if(!frame){last=0;frame=requestAnimationFrame(tick);}
}
function collect(id,button){
 const fresh=!discovered.includes(id);if(fresh){discovered.push(id);try{localStorage.setItem('aquamarine.sky.collection.v1',JSON.stringify(discovered));}catch{}drawBadges();}
 const r=button.getBoundingClientRect();celebrate(fresh?names[id]+' discovered. '+discovered.length+' / 5 stars collected.':names[id]+' sends a little starlight.',discovered.length===5&&fresh,{x:r.left+r.width/2,y:r.top+r.height/2});
}
const sections=document.querySelectorAll('.home-education,.home-honors,.travel-journal,.online-posts,.experience-hero,.portfolio-hero');
sections.forEach(section=>{
 const id=section.matches('.home-education')?'scholar':section.matches('.home-honors')?'nova':section.matches('.travel-journal')?'voyager':section.matches('.online-posts,.portfolio-hero')?'creator':'dreamer';
 const b=document.createElement('button');b.type='button';b.className='sky-discovery';b.textContent='✧';b.setAttribute('aria-label','Discover a little starlight');b.title='A little starlight awaits';b.addEventListener('click',()=>collect(id,b));section.classList.add('has-sky-discovery');section.append(b);
});
document.addEventListener('sky-heart',event=>{
 const n=event.detail.count;
 if(n>0&&n%100===0)celebrate('A hundred little lights - a meteor shower for you.',true);
 else if(n%100===42)celebrate('42: a little answer from the galaxy.',true);
 else if(n%10===7)celebrate('Lucky starlight - a comet crosses your sky.');
 else if(n>0&&n%10===0)celebrate('Another ten lights join your constellation.');
});
const visits=Number(document.querySelector('[data-visit-count]')?.textContent);
if(visits>0&&(visits%10===7||visits%100===42)){
 let shown=false;try{shown=sessionStorage.getItem('aquamarine.sky.visit')===String(visits);sessionStorage.setItem('aquamarine.sky.visit',String(visits));}catch{}
 if(!shown)setTimeout(()=>celebrate('Visit '+visits+': welcome back to your little galaxy.'),900);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});addEventListener('pagehide',stop);addEventListener('resize',stop);reduced.addEventListener('change',stop);drawBadges();
})();
