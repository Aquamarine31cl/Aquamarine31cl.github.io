(() => {
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-photo-gallery]').forEach(gallery=>{
const panels=[...gallery.querySelectorAll('[data-photo-panel]')],buttons=[...gallery.querySelectorAll('[data-photo-select]')];let animation=null;
buttons.forEach(button=>button.addEventListener('click',()=>{if(button.getAttribute('aria-pressed')==='true')return;const index=button.dataset.photoSelect;if(animation)animation.cancel();panels.forEach(panel=>panel.hidden=panel.dataset.photoPanel!==index);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const panel=panels.find(p=>p.dataset.photoPanel===index);if(panel&&!reduce.matches&&panel.animate)animation=panel.animate([{opacity:.35,transform:'translateY(4px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:280,easing:'cubic-bezier(.2,.7,.3,1)'});}));
});
})();
(() => {
 const journal=document.querySelector('.travel-journal');
 const passport=journal?.querySelector('.travel-star-passport');
 if(!passport)return;
 const progress=passport.querySelector('[data-passport-progress]');
 const reveal=passport.querySelector('[data-passport-reveal]');
 const route=passport.querySelector('svg');
 const result=passport.querySelector('[data-passport-result]');
 const stamps=new Map();
 passport.hidden=false;

 journal.addEventListener('click',event=>{
  const control=event.target.closest('[data-photo-select]');
  const city=control?.closest('.city-journey');
  if(!city||control.dataset.photoSelect==='0'||stamps.has(city.id)||stamps.size===3)return;
  stamps.set(city.id,city.querySelector('.city-heading-copy h4').textContent.trim());
  progress.textContent=stamps.size+' / 3 destinations stamped';
  if(stamps.size===3){
   reveal.hidden=false;
   document.dispatchEvent(new CustomEvent('sky-surprise',{detail:{message:'Your Star Passport is full. Trace your route at the top of the journal.'}}));
  }
 });

 reveal.addEventListener('click',()=>{
  route.removeAttribute('hidden');
  route.classList.remove('is-tracing');
  route.getBoundingClientRect();
  route.classList.add('is-tracing');
  result.textContent='Atlas Trail discovered. Your browsing route: '+[...stamps.values()].join(' → ')+'.';
 });
 document.addEventListener('visibilitychange',()=>{
  if(document.hidden)route.classList.remove('is-tracing');
 });
})();
/* Compute once per layout change, from all three frames, so switching photographs never shifts a row. */
(() => {
 const grid=document.querySelector('.travel-city-grid');if(!grid)return;
 const cards=[...grid.querySelectorAll('.city-journey')];let frame=0;
 function sizeRows(){
  frame=0;const rows=new Map();
  for(const card of cards){const top=Math.round(card.offsetTop);if(!rows.has(top))rows.set(top,[]);rows.get(top).push(card);}
  for(const row of rows.values()){
   let ratio=.75;
   for(const card of row)for(const img of card.querySelectorAll('img[data-photo-width]'))ratio=Math.max(ratio,Number(img.dataset.photoHeight)/Number(img.dataset.photoWidth));
   const width=row[0].querySelector('.city-photo-stage')?.clientWidth||180;
   const height=Math.round(Math.min(420,Math.max(170,width*Math.min(1.34,ratio)+50)));
   for(const card of row)card.style.setProperty('--travel-frame-height',height+'px');
  }
 }
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(sizeRows);};
 if('ResizeObserver' in window){let lastWidth=0;new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(Math.abs(width-lastWidth)>.5){lastWidth=width;schedule();}}).observe(grid);}else window.addEventListener('resize',schedule);
 document.fonts?.ready.then(schedule);schedule();
})();
