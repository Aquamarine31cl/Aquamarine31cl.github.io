(() => {
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const announce=(message,strong=false)=>document.dispatchEvent(new CustomEvent('sky-surprise',{detail:{message,strong}}));
const entries=[
 ['scholar','Research','/#education-heading','Questions, materials and discovery.',50,16],
 ['nova','Recognition','/#honors','Milestones earned along the way.',80,40],
 ['voyager','Travel','/experiences/travel/','A passport written in places.',68,76],
 ['creator','Online Posts','/online-posts/','Rhythm, play and a personal soundtrack.',32,76],
 ['dreamer','Everyday Moments','/experiences/moments/','The small stories between the stars.',20,40]
];
const dialog=document.createElement('dialog');dialog.className='sky-atlas-dialog';dialog.setAttribute('aria-labelledby','sky-atlas-heading');
dialog.innerHTML='<button type="button" class="sky-atlas-close" aria-label="Close star atlas">×</button><p class="cosmic-eyebrow">YOUR PERSONAL CONSTELLATION</p><h2 id="sky-atlas-heading">A Sky of Your Own</h2><p class="sky-atlas-intro">Collected stars glow brighter. Every star leads to a chapter.</p><div class="sky-atlas-map"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M50 16L80 40L68 76L32 76L20 40Z M50 16L68 76 M80 40L32 76 M20 40L68 76"/></svg></div><p class="sky-atlas-caption" aria-live="polite">Choose a star to explore.</p><p class="sky-atlas-note">Your discoveries stay on this browser.</p>';
const traceButton=document.createElement('button');traceButton.type='button';traceButton.className='sky-trace-toggle';traceButton.textContent='Trace a Constellation';traceButton.setAttribute('aria-pressed','false');dialog.append(traceButton);
let tracing=false,chosen=[];
document.body.append(dialog);const map=dialog.querySelector('.sky-atlas-map'),caption=dialog.querySelector('.sky-atlas-caption');let opener;
for(const [id,label,url,note,x,y] of entries){
 const a=document.createElement('a');a.className='sky-atlas-node';a.href=url;a.dataset.discovery=id;a.style.left=x+'%';a.style.top=y+'%';a.innerHTML='<span aria-hidden="true">✦</span><span>'+label+'</span>';
 a.addEventListener('click',e=>{
  if(!tracing)return;e.preventDefault();
  if(chosen.includes(id))return;
  chosen.push(id);a.classList.add('is-traced');
  const points=chosen.map(key=>entries.find(v=>v[0]===key)).map(v=>v[4]+','+v[5]).join(' ');
  let trail=map.querySelector('.sky-trace-line');if(!trail){trail=document.createElementNS('http://www.w3.org/2000/svg','polyline');trail.classList.add('sky-trace-line');map.querySelector('svg').append(trail);}trail.setAttribute('points',points);
  caption.textContent=chosen.length+' / 5 stars connected.';
  if(chosen.length===5&&chosen.join(',')===entries.slice().reverse().map(e=>e[0]).join(',')){
    dialog.setAttribute('data-mirror-sky','');caption.textContent='Mirror Sky - familiar stars, a different direction.';announce('Mirror Sky - a constellation found in reverse.',true);
   }else if(chosen.length===5){caption.textContent='Your own constellation - a new path through familiar stars.';announce('Cartographer of a little galaxy - five stars, your own constellation.',true);}
 });
 a.addEventListener('pointerenter',()=>caption.textContent=note);a.addEventListener('focus',()=>caption.textContent=note);map.append(a);
}
traceButton.addEventListener('click',()=>{
 tracing=!tracing;chosen=[];dialog.removeAttribute('data-mirror-sky');traceButton.setAttribute('aria-pressed',String(tracing));
 traceButton.textContent=tracing?'Return to Navigation':'Trace a Constellation';
 map.querySelector('.sky-trace-line')?.remove();map.querySelectorAll('.is-traced').forEach(el=>el.classList.remove('is-traced'));
 caption.textContent=tracing?'Choose all five stars in any order. Links will not navigate in drawing mode.':'Choose a star to explore.';
});
function update(){let found=[];try{found=JSON.parse(localStorage.getItem('aquamarine.sky.collection.v1')||'[]');}catch{}dialog.querySelectorAll('[data-discovery]').forEach(a=>{const yes=Array.isArray(found)&&found.includes(a.dataset.discovery);a.classList.toggle('is-found',yes);a.setAttribute('aria-label',a.textContent.trim()+(yes?' - discovered':' - not yet discovered'));});}
function open(button){opener=button;update();dialog.showModal();dialog.querySelector('.sky-atlas-close').focus();}
function close(){if(tracing)traceButton.click();dialog.close();opener?.focus({preventScroll:true});}
dialog.querySelector('.sky-atlas-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog)close();});document.addEventListener('sky-collection-change',update);
const corner=document.querySelector('.visitor-corner .visitor-controls');
if(corner){
 const actions=document.createElement('div');actions.className='sky-actions';
 const atlas=document.createElement('button');atlas.type='button';atlas.textContent='Explore My Star Atlas';atlas.addEventListener('click',()=>open(atlas));
 const wish=document.createElement('button');wish.type='button';wish.className='sky-wish-button';wish.textContent='Hold to Make a Wish';wish.setAttribute('aria-label','Make a wish. Hold with the pointer, or press Enter or Space.');
 let timer=0,lastWish=0;
 function cancel(){clearTimeout(timer);timer=0;wish.removeAttribute('data-charging');}
 function release(){cancel();if(Date.now()-lastWish<2200)return;lastWish=Date.now();document.dispatchEvent(new CustomEvent('sky-wish-released'));announce('A wish released - a comet carries it into the galaxy.',true);}
 wish.addEventListener('pointerdown',e=>{if(e.button!==0)return;cancel();wish.setPointerCapture(e.pointerId);wish.dataset.charging='';timer=setTimeout(release,700);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>wish.addEventListener(type,cancel));wish.addEventListener('click',e=>{if(e.detail===0)release();});
 addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 actions.append(atlas,wish);corner.append(actions);
}
const hero=document.querySelector('.experience-hero');
if(hero&&document.querySelector('.art-moon')){
 const button=document.createElement('button');button.type='button';button.className='sky-alignment';button.textContent='Align the Planets ✧';let cooldown=0;
 button.addEventListener('click',()=>{if(Date.now()-cooldown<7500)return;cooldown=Date.now();document.dispatchEvent(new CustomEvent('sky-alignment'));announce(reduce.matches?'Three worlds, one constellation.':'Three worlds find a moment of alignment.');});const actionRow=document.createElement('div');actionRow.className='sky-experience-actions';hero.append(actionRow);actionRow.append(button);
 const eclipse=document.createElement('button');eclipse.type='button';eclipse.className='sky-alignment';eclipse.textContent='Observe an Eclipse ◐';let lastEclipse=0;
 eclipse.addEventListener('click',()=>{if(Date.now()-lastEclipse<10000)return;lastEclipse=Date.now();document.dispatchEvent(new CustomEvent('sky-eclipse'));announce(reduce.matches?'A quiet eclipse, imagined in starlight.':'A quiet eclipse crosses one of your little worlds.');});actionRow.append(eclipse);
}

const moonCard=document.createElement('section');moonCard.className='sky-moon-card';
moonCard.innerHTML='<button type="button" class="sky-moon-dial" aria-label="Advance the moon phase"><canvas width="96" height="96" aria-hidden="true"></canvas></button><div><p class="cosmic-eyebrow">A LITTLE LUNAR EXPERIMENT</p><h3 class="sky-moon-label">New Moon</h3><p class="sky-moon-help">Turn the moon. See what a full cycle reveals.</p></div>';
dialog.append(moonCard);
const phases=['New Moon','Waxing Crescent','First Quarter','Waxing Gibbous','Full Moon','Waning Gibbous','Last Quarter','Waning Crescent'];
let phase=0,turns=0;
const moonCanvas=moonCard.querySelector('canvas'),moonContext=moonCanvas.getContext('2d');
function paintMoon(){
 if(!moonContext)return;
 const image=moonContext.createImageData(96,96),angle=Math.PI-phase*Math.PI/4;
 for(let y=0;y<96;y++)for(let x=0;x<96;x++){
  const nx=(x-47.5)/43,ny=(y-47.5)/43,r=nx*nx+ny*ny;if(r>1)continue;
  const nz=Math.sqrt(1-r),light=Math.max(0,nx*Math.sin(angle)+nz*Math.cos(angle));
  const grain=.94+.06*Math.sin(x*1.7+y*.8)*Math.cos(y*2.1);
  const value=(20+205*Math.pow(light,.55))*grain,i=(y*96+x)*4;
  image.data[i]=value;image.data[i+1]=value*.96;image.data[i+2]=Math.min(255,value*1.06+7);
  image.data[i+3]=Math.min(255,(1-r)*6000);
 }
 moonContext.putImageData(image,0,0);
 moonCard.querySelector('.sky-moon-label').textContent=phases[phase];
 moonCard.querySelector('button').setAttribute('aria-label',phases[phase]+'. Advance the moon phase.');
}
moonCard.querySelector('button').addEventListener('click',()=>{
 phase=(phase+1)%8;turns++;paintMoon();
 if(phase===4){caption.textContent='Full moon: a quiet silver light in your little sky.';}
 if(turns===8){
  moonCard.setAttribute('data-cycle-complete','');
  caption.textContent='Lunar Explorer - a full cycle, back where the journey began.';
  announce('Lunar Explorer - eight phases, one complete journey.',true);
 }
});
paintMoon();

})();
