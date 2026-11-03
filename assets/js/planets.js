(() => {
 const cards=Array.from(document.querySelectorAll('.experience-art'));
 if(!cards.length)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let frame=0,last=0,time=0;
 const states=cards.map((el,i)=>{
  const kind=el.dataset.planet;
  const [a,b,rotation,period]=kind==='travel'?[117,35,-24,18]:kind==='sports'?[114.5,31.5,17,23]:[151,48,-24,26];
  if(kind==='moments'){const track=document.createElement('span');track.className='art-satellite-track';el.append(track);}
  return {el,moon:el.querySelector('.art-moon'),a,b,rotation:rotation*Math.PI/180,period,phase:i*2.1};
 });
 function paint(){
  for(const s of states){
   if(!s.moon)continue;
   const theta=time*2*Math.PI/s.period+s.phase,x=s.a*Math.cos(theta),y=s.b*Math.sin(theta);
   const px=x*Math.cos(s.rotation)-y*Math.sin(s.rotation),py=x*Math.sin(s.rotation)+y*Math.cos(s.rotation);
   s.moon.style.transform='translate('+px.toFixed(3)+'px,'+py.toFixed(3)+'px) translate(-50%,-50%)';
   s.moon.style.zIndex=y<0?'1':'4';
  }
 }
 function tick(now){frame=0;const dt=last?Math.min((now-last)/1000,.05):0;last=now;time+=dt;paint();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;paint();if(!document.hidden&&!reduced.matches)frame=requestAnimationFrame(tick);}
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);addEventListener('pageshow',sync);addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;last=0;});sync();
})();
