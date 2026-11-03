(() => {
 const cards=Array.from(document.querySelectorAll('.experience-art'));
 if(!cards.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,last=0,time=0,aligningAt=-100;
 const states=cards.map((el,i)=>{
  const kind=el.dataset.planet;
  const cloud=document.createElement('span');cloud.className='planet-cloud-layer';el.querySelector('.art-orb')?.append(cloud);
  const corona=document.createElement('span');corona.className='planet-corona';el.append(corona);
  const dust=Array.from({length:kind==='moments'?18:10},(_,n)=>{const dot=document.createElement('span');dot.className='planet-orbit-grain';dot.style.opacity=String(.25+(n%4)*.15);el.append(dot);return dot;});
  const [a,b,rotation,period]=kind==='travel'?[117,35,-24,18]:kind==='sports'?[114.5,31.5,17,23]:[151,48,-24,26];
  if(kind==='moments'){const track=document.createElement('span');track.className='art-satellite-track';el.append(track);}
  return {el,moon:el.querySelector('.art-moon'),a,b,rotation:rotation*Math.PI/180,period,phase:i*2.1,dust};
 });
 function paint(){
  for(const s of states){
   if(!s.moon)continue;
   let theta=time*2*Math.PI/s.period+s.phase;
   const age=time-aligningAt;
   if(age>=0&&age<7){
    const smooth=x=>x*x*(3-2*x);
    const blend=age<2?smooth(age/2):age<5?1:1-smooth((age-5)/2);
    const nearest=Math.round(theta/(2*Math.PI))*2*Math.PI;
    theta+=(nearest-theta)*blend;
   }
   const x=s.a*Math.cos(theta),y=s.b*Math.sin(theta);
   const px=x*Math.cos(s.rotation)-y*Math.sin(s.rotation),py=x*Math.sin(s.rotation)+y*Math.cos(s.rotation);
   s.moon.style.transform='translate('+px.toFixed(3)+'px,'+py.toFixed(3)+'px) translate(-50%,-50%)';
   s.moon.style.zIndex=y<0?'1':'4';
   s.dust.forEach((dot,n)=>{
    const t=time*(s.el.dataset.planet==='moments'?.11:.16)+n*2*Math.PI/s.dust.length;
    const spread=s.el.dataset.planet==='moments'? .86+(n%3)*.045:1;
    const dx=s.a*spread*Math.cos(t),dy=s.b*spread*Math.sin(t);
    const x=dx*Math.cos(s.rotation)-dy*Math.sin(s.rotation),y=dx*Math.sin(s.rotation)+dy*Math.cos(s.rotation);
    dot.style.transform='translate('+x.toFixed(2)+'px,'+y.toFixed(2)+'px)';dot.style.zIndex=dy<0?'1':'4';
   });
  }
 }
 function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;paint();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;paint();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
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
 document.addEventListener('sky-alignment',()=>{if(!reduced.matches)aligningAt=time;});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);addEventListener('pageshow',sync);addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;last=0;});sync();
})();
