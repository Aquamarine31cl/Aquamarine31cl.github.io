(() => {
 const cards=Array.from(document.querySelectorAll('.experience-art'));
 if(!cards.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,last=0,time=0,orbitPulseTimer=0;
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
  return {el,moon:el.querySelector('.art-moon'),a,b,rotation:rotation*Math.PI/180,period,phase:i*2.1,dust};
 });
 function paint(){
  for(const s of states){
   if(!s.moon)continue;
   const theta=time*2*Math.PI/s.period+s.phase;
   const x=s.a*Math.cos(theta),y=s.b*Math.sin(theta);
   const px=x*Math.cos(s.rotation)-y*Math.sin(s.rotation),py=x*Math.sin(s.rotation)+y*Math.cos(s.rotation);
   s.moon.style.transform='translate('+px.toFixed(3)+'px,'+py.toFixed(3)+'px) translate(-50%,-50%)';
   s.moon.style.zIndex=y<0?'1':'4';
   s.dust.forEach((dot,n)=>{
    const t=time*(s.el.dataset.planet==='moments'?.11:.16)+n*2*Math.PI/s.dust.length;
    const ring=s.el.dataset.planet==='moments';
    const da=ring?119+(n%3)*4.5:s.a,db=ring?27+(n%3)*1.2:s.b;
    const dx=da*Math.cos(t),dy=db*Math.sin(t);
    const x=dx*Math.cos(s.rotation)-dy*Math.sin(s.rotation),y=dx*Math.sin(s.rotation)+dy*Math.cos(s.rotation);
    dot.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px)';dot.style.zIndex=dy<0?'1':'4';
   });
  }
 }
 let inView=true;
 const canAnimate=()=>inView&&!document.hidden&&!reduced.matches;
 function tick(now){frame=0;if(!canAnimate())return;const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;paint();frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;paint();if(canAnimate())frame=requestAnimationFrame(tick);}
 if(typeof IntersectionObserver==='function'){
  const visibleCards=new Set();
  const observer=new IntersectionObserver(entries=>{
   for(const entry of entries){
    if(entry.isIntersecting)visibleCards.add(entry.target);
    else visibleCards.delete(entry.target);
   }
   const visible=visibleCards.size>0;
   if(visible!==inView){inView=visible;sync();}
  });
  cards.forEach(card=>observer.observe(card));
 }
 let eclipseTimer=0,eclipseIndex=0;
 function clearEclipse(){clearTimeout(eclipseTimer);cards.forEach(el=>el.removeAttribute('data-eclipse'));}
 document.addEventListener('sky-eclipse',()=>{clearEclipse();if(reduced.matches)return;cards[eclipseIndex++%cards.length].setAttribute('data-eclipse','');eclipseTimer=setTimeout(clearEclipse,9500);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearEclipse();});addEventListener('pagehide',clearEclipse);reduced.addEventListener('change',clearEclipse);
 let tour=[],tourTime=0;
 cards.forEach(el=>{
  function visit(){
   const now=performance.now();if(now-tourTime>8000)tour=[];tourTime=now;
   const kind=el.dataset.planet;if(!tour.includes(kind))tour.push(kind);
   if(tour.length===3){
    tour=[];let seen=false;try{seen=sessionStorage.getItem('aquamarine.grandtour')==='1';sessionStorage.setItem('aquamarine.grandtour','1');}catch{}
    if(!seen){document.dispatchEvent(new CustomEvent('sky-surprise',{detail:{message:'Grand Tour - three worlds explored, one little universe.',strong:true}}));cards.forEach(c=>c.setAttribute('data-resonance',''));setTimeout(()=>cards.forEach(c=>c.removeAttribute('data-resonance')),4500);}
   }
  }
  el.addEventListener('pointerenter',visit);el.closest('a')?.addEventListener('focus',visit);
 });
 function clearOrbitPulse(){clearTimeout(orbitPulseTimer);cards.forEach(el=>el.removeAttribute('data-orbit-pulse'));}
 document.addEventListener('sky-alignment',()=>{clearOrbitPulse();if(reduced.matches)return;cards.forEach(el=>el.setAttribute('data-orbit-pulse',''));orbitPulseTimer=setTimeout(clearOrbitPulse,4000);});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clearOrbitPulse();});addEventListener('pagehide',clearOrbitPulse);reduced.addEventListener('change',clearOrbitPulse);
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);addEventListener('pageshow',sync);addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;last=0;});sync();
})();
