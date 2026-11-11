(() => {
 const cards=Array.from(document.querySelectorAll('.experience-art'));
 if(!cards.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,last=0,pageActive=true;
 const states=cards.map((el,i)=>{
  const kind=el.dataset.planet;
  const eclipse=document.createElement('span');eclipse.className='planet-eclipse-window';eclipse.innerHTML='<span></span>';el.querySelector('.art-orb')?.append(eclipse);
  const cloud=document.createElement('span');cloud.className='planet-cloud-layer';el.querySelector('.art-orb')?.append(cloud);
  const corona=document.createElement('span');corona.className='planet-corona';el.append(corona);
  const dust=Array.from({length:kind==='moments'?18:10},(_,n)=>{const dot=document.createElement('span');dot.className='planet-orbit-grain';dot.style.opacity=String(.25+(n%4)*.15);el.append(dot);return dot;});
  const [a,b,rotation,period]=kind==='travel'?[117,35,-24,18]:kind==='sports'?[114.5,31.5,17,23]:[151,48,-24,26];
  // The visible track and the moving moon share the very same ellipse.
  const ns='http://www.w3.org/2000/svg',track=document.createElementNS(ns,'svg'),ellipse=document.createElementNS(ns,'ellipse'),size=a*2+24;
  track.classList.add('planet-moon-track');track.setAttribute('viewBox',[-size/2,-size/2,size,size].join(' '));track.setAttribute('aria-hidden','true');
  track.style.width=size+'px';track.style.height=size+'px';
  ellipse.setAttribute('rx',a);ellipse.setAttribute('ry',b);ellipse.setAttribute('transform','rotate('+rotation+')');track.append(ellipse);el.append(track);
  return {el,moon:el.querySelector('.art-moon'),a,b,rotation:rotation*Math.PI/180,period,phase:i*2.1,dust,ring:kind==='moments',time:0};
 });
 function paint(s){
   if(!s.moon)return;
   const theta=s.time*2*Math.PI/s.period+s.phase;
   const x=s.a*Math.cos(theta),y=s.b*Math.sin(theta);
   const cos=Math.cos(s.rotation),sin=Math.sin(s.rotation);
   const px=x*cos-y*sin,py=x*sin+y*cos;
   s.moon.style.transform='translate('+px.toFixed(3)+'px,'+py.toFixed(3)+'px) translate(-50%,-50%)';
   s.moon.style.zIndex=y<0?'1':'4';
   s.dust.forEach((dot,n)=>{
    const t=s.time*(s.ring?.11:.16)+n*2*Math.PI/s.dust.length;
    const da=s.ring?119+(n%3)*4.5:s.a,db=s.ring?27+(n%3)*1.2:s.b;
    const dx=da*Math.cos(t),dy=db*Math.sin(t);
    const x=dx*cos-dy*sin,y=dx*sin+dy*cos;
    dot.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px)';dot.style.zIndex=dy<0?'1':'4';
   });
 }
 const byCard=new Map(states.map(state=>[state.el,state]));
 const visible=new Set(states);
 const canAnimate=()=>pageActive&&visible.size>0&&!document.hidden&&!reduced.matches;
 function tick(now){
  frame=0;if(!canAnimate())return;
  const dt=last?Math.min((now-last)/1000,.05):0;last=now;
  for(const state of visible){state.time+=dt;paint(state);}
  frame=requestAnimationFrame(tick);
 }
 function sync(){
  if(canAnimate()){
   if(!frame)frame=requestAnimationFrame(tick);
  }else{
   cancelAnimationFrame(frame);frame=0;last=0;
  }
 }
 if(typeof IntersectionObserver==='function'){
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    const state=byCard.get(entry.target);
    entry.target.toggleAttribute('data-planet-offscreen',!entry.isIntersecting);
    if(entry.isIntersecting)visible.add(state);
    else visible.delete(state);
   }
   sync();
  });
  cards.forEach(card=>observer.observe(card));
 }
 const effects=new Map();
 function clearEffect(name){
  clearTimeout(effects.get(name));effects.delete(name);
  cards.forEach(el=>el.removeAttribute(name));
 }
 function triggerEffect(name,targets,duration){
  clearEffect(name);
  if(reduced.matches||document.hidden||!pageActive)return;
  targets.forEach(el=>el.setAttribute(name,''));
  effects.set(name,setTimeout(()=>clearEffect(name),duration));
 }
 function clearEffects(){for(const name of effects.keys())clearEffect(name);tour=[];}
 let eclipseIndex=0;
 document.addEventListener('sky-eclipse',()=>{
  const targets=cards.filter(el=>visible.has(byCard.get(el)));
  const pool=targets.length?targets:cards;
  triggerEffect('data-eclipse',[pool[eclipseIndex++%pool.length]],9500);
 });
 let tour=[],tourTime=0;
 cards.forEach(el=>{
  function visit(){
   const now=performance.now();if(now-tourTime>8000)tour=[];tourTime=now;
   const kind=el.dataset.planet;if(!tour.includes(kind))tour.push(kind);
   if(tour.length===3){
    tour=[];let seen=false;try{seen=sessionStorage.getItem('aquamarine.grandtour')==='1';sessionStorage.setItem('aquamarine.grandtour','1');}catch{}
    if(!seen){document.dispatchEvent(new CustomEvent('sky-surprise',{detail:{message:'Grand Tour - three worlds explored, one little universe.',strong:true}}));triggerEffect('data-resonance',cards,4500);}
   }
  }
  el.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')visit();});
  el.closest('a')?.addEventListener('focus',()=>{if(el.closest('a').matches(':focus-visible'))visit();});
 });
 document.addEventListener('sky-alignment',()=>triggerEffect('data-orbit-pulse',cards,4000));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearEffects();sync();});
 reduced.addEventListener('change',()=>{if(reduced.matches)clearEffects();sync();});
 addEventListener('pageshow',()=>{pageActive=true;sync();});
 addEventListener('pagehide',()=>{pageActive=false;clearEffects();sync();});
 states.forEach(paint);sync();
})();
