/* Native browser interactions. No animation framework or background changes. */
(() => {
 'use strict';
 const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
 const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
 const selector='.education-card,.honor-feature,.news-photo-card,.honor-stat,.academic-card,.experience-section:not(.experience-section--atlas),.city-photo-card';
 const cards=[...document.querySelectorAll(selector)].filter(el=>!el.parentElement.closest(selector)&&!el.closest('.leaflet-container'));
 const reset=card=>{delete card.dataset.pointerActive;card.style.removeProperty('--tilt-x');card.style.removeProperty('--tilt-y');};
 cards.forEach(card=>{
  card.classList.add('motion-card');
  const sheen=document.createElement('span');sheen.className='motion-sheen';sheen.setAttribute('aria-hidden','true');card.append(sheen);
  let frame=0;let position=null;
  const render=()=>{frame=0;if(!position||reduce.matches||!fine.matches)return;const rect=card.getBoundingClientRect();if(!rect.width||!rect.height)return;const x=Math.max(0,Math.min(1,(position.x-rect.left)/rect.width));const y=Math.max(0,Math.min(1,(position.y-rect.top)/rect.height));card.style.setProperty('--touch-x',(x*100).toFixed(2)+'%');card.style.setProperty('--touch-y',(y*100).toFixed(2)+'%');const strength=rect.height>520?0:2;card.style.setProperty('--tilt-x',((.5-y)*strength).toFixed(2)+'deg');card.style.setProperty('--tilt-y',((x-.5)*strength).toFixed(2)+'deg');card.dataset.pointerActive='true';};
  card.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||reduce.matches||!fine.matches)return;position={x:event.clientX,y:event.clientY};if(!frame)frame=requestAnimationFrame(render);},{passive:true});
  const leave=()=>{if(frame)cancelAnimationFrame(frame);frame=0;position=null;reset(card);};
  card.addEventListener('pointerleave',leave);card.addEventListener('pointercancel',leave);window.addEventListener('blur',leave);
 });
 if('IntersectionObserver' in window&&!reduce.matches){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('motion-arrived');observer.unobserve(entry.target);}});},{threshold:.12});cards.filter(card=>!card.classList.contains('honors-reveal')).forEach(card=>observer.observe(card));}
 const progress=document.createElement('div');progress.className='motion-scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
 let scheduled=false;
 const draw=()=>{scheduled=false;const length=document.documentElement.scrollHeight-window.innerHeight;const value=length>0?Math.max(0,Math.min(1,window.scrollY/length)):0;progress.style.setProperty('--reading-progress',value.toFixed(4));};
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(draw);}};
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule,{passive:true});window.addEventListener('load',schedule,{once:true});
 if('ResizeObserver' in window)new ResizeObserver(schedule).observe(document.body);draw();
 const sync=()=>{if(reduce.matches||!fine.matches)cards.forEach(reset);};
 reduce.addEventListener('change',sync);fine.addEventListener('change',sync);
})();
