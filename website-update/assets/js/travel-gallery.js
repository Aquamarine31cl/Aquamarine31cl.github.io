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
