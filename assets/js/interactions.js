/* Pointer feedback uses one interpolator and stable, untransformed hit areas. */
(() => {
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
const allowed=()=>fine.matches&&!reduce.matches;
const selector='.education-card,.honor-feature,.news-photo-card,.honor-stat,.academic-card,.experience-choice,.city-journey';
const cards=[...document.querySelectorAll(selector)].filter(el=>!el.parentElement.closest(selector)&&!el.closest('.leaflet-container'));
const arrivals=[...new Set([...cards,...document.querySelectorAll('.home-intro,.experience-hero,.page__title')])];
const magnets=[...document.querySelectorAll('.home-paths a,.experience-tabs a,.academic-links a,.experience-back')];
const active=new Set(),states=[],cardMap=new Map(),magnetMap=new Map();let raf=0,last=0,hoveredCard=null,hoveredMagnet=null;
function paint(state){if(state.kind==='card'){state.el.style.setProperty('--tilt-x',(-state.y*state.strength).toFixed(4)+'deg');state.el.style.setProperty('--tilt-y',(state.x*state.strength).toFixed(4)+'deg');state.el.style.setProperty('--surface-lift',state.lift.toFixed(4)+'px');}else{state.el.style.setProperty('--magnet-x',state.x.toFixed(4)+'px');state.el.style.setProperty('--magnet-y',state.y.toFixed(4)+'px');}}
function wake(state){active.add(state);if(!raf){last=performance.now();raf=requestAnimationFrame(step);}}
function step(now){raf=0;const dt=Math.min(now-last,48);last=now;
for(const state of active){const k=1-Math.exp(-dt/(state.hover?90:130));const targetLift=state.hover?state.maxLift:0;state.x+=(state.tx-state.x)*k;state.y+=(state.ty-state.y)*k;state.lift+=(targetLift-state.lift)*k;
if(Math.abs(state.x-state.tx)+Math.abs(state.y-state.ty)+Math.abs(state.lift-targetLift)<.001){state.x=state.tx;state.y=state.ty;state.lift=targetLift;active.delete(state);if(!state.hover)state.rect=null;}paint(state);}
if(active.size)raf=requestAnimationFrame(step);}
function leave(state){if(!state)return;state.hover=false;state.tx=state.ty=0;state.el.removeAttribute('data-pointer-active');wake(state);}
function restRect(state){const r=state.el.getBoundingClientRect(),width=state.el.offsetWidth,height=state.el.offsetHeight;const left=r.left+(r.width-width)/2-(state.kind==='magnet'?state.x:0),top=r.top+(r.height-height)/2+(state.kind==='card'?state.lift:-state.y);return{left,top,right:left+width,bottom:top+height,width,height};}
function inside(rect,x,y){return rect&&x>=rect.left&&x<=rect.right&&y>=rect.top&&y<=rect.bottom;}
function clearArrival(el){el.classList.remove('motion-arrived');el.style.removeProperty('--arrival-delay');}
function finishArrival(el){clearArrival(el);for(const animation of el.getAnimations?.()||[]){if(animation.animationName==='honor-rise-in'){try{animation.finish();}catch(e){}}}}
function makeState(el,kind){const compact=el.classList.contains('city-journey');const state={el,kind,x:0,y:0,tx:0,ty:0,lift:0,hover:false,rect:null,strength:compact?.8:1.5,maxLift:kind==='magnet'?0:compact?1.2:2.5};states.push(state);return state;}
for(const card of cards){card.classList.add('motion-card');const sheen=document.createElement('span');sheen.className='motion-sheen';sheen.setAttribute('aria-hidden','true');const edge=document.createElement('span');edge.className='motion-edge';edge.setAttribute('aria-hidden','true');card.append(sheen,edge);cardMap.set(card,makeState(card,'card'));}
for(const el of magnets){el.classList.add('motion-magnetic');magnetMap.set(el,makeState(el,'magnet'));}
function find(target,match,map){let el=target.closest(match);while(el&&!map.has(el))el=el.parentElement&&el.parentElement.closest(match);return el?map.get(el):null;}
function update(state,event){if(!state.hover){finishArrival(state.el);state.rect=restRect(state);state.hover=true;}const rect=state.rect;const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));if(state.kind==='card'){state.tx=x-.5;state.ty=y-.5;state.el.dataset.pointerActive='true';state.el.style.setProperty('--touch-x',(x*100).toFixed(2)+'%');state.el.style.setProperty('--touch-y',(y*100).toFixed(2)+'%');}else{state.tx=(x-.5)*4.5;state.ty=(y-.5)*3;}wake(state);}
function release(){leave(hoveredCard);leave(hoveredMagnet);hoveredCard=hoveredMagnet=null;}
document.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||!allowed()||event.buttons){release();return;}if(hoveredCard&&!inside(hoveredCard.rect,event.clientX,event.clientY)){leave(hoveredCard);hoveredCard=null;}if(!hoveredCard)hoveredCard=find(event.target,selector,cardMap);if(hoveredCard)update(hoveredCard,event);if(hoveredMagnet&&!inside(hoveredMagnet.rect,event.clientX,event.clientY)){leave(hoveredMagnet);hoveredMagnet=null;}if(!hoveredMagnet)hoveredMagnet=find(event.target,'.motion-magnetic',magnetMap);if(hoveredMagnet)update(hoveredMagnet,event);},{passive:true});
document.addEventListener('pointerleave',release);document.addEventListener('pointercancel',release);addEventListener('scroll',release,{passive:true});addEventListener('resize',release,{passive:true});addEventListener('blur',release);
const reset=()=>{active.clear();if(raf)cancelAnimationFrame(raf);raf=0;hoveredCard=hoveredMagnet=null;for(const state of states){state.hover=false;state.x=state.y=state.tx=state.ty=state.lift=0;state.rect=null;state.el.removeAttribute('data-pointer-active');paint(state);}};
let keyboardNavigation=false;
document.addEventListener('keydown',event=>{if(event.key==='Tab')keyboardNavigation=true;},true);
document.addEventListener('pointerdown',()=>{keyboardNavigation=false;reset();},true);
function resetMotion(){reset();arrivals.forEach(clearArrival);}
addEventListener('pagehide',resetMotion);
addEventListener('pageshow',()=>{reset();document.querySelectorAll('[data-sweep-running]').forEach(el=>el.removeAttribute('data-sweep-running'));if(!keyboardNavigation&&document.activeElement?.matches('a.motion-card,a.motion-magnetic'))document.activeElement.blur();});
reduce.addEventListener('change',resetMotion);fine.addEventListener('change',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)resetMotion();});
if('IntersectionObserver' in window){
 const order=new Map(arrivals.map((el,index)=>[el,index]));
 const observer=new IntersectionObserver(entries=>{
  for(const {target:el,isIntersecting} of entries){
   if(!isIntersecting)continue;
   observer.unobserve(el);
   if(reduce.matches||document.hidden||el.hasAttribute('data-pointer-active')||el.classList.contains('honors-reveal'))continue;
   el.style.setProperty('--arrival-delay',(order.get(el)%6)*35+'ms');
   el.classList.add('motion-arrived');
  }
 },{threshold:.06,rootMargin:'0px 0px -16px 0px'});
 for(const el of arrivals){
  const finish=event=>{if(event.target===el&&event.animationName==='surface-arrive')clearArrival(el);};
  el.addEventListener('animationend',finish);
  el.addEventListener('animationcancel',finish);
  observer.observe(el);
 }
}
const progress=document.createElement('div');progress.className='motion-scroll-progress';progress.setAttribute('aria-hidden','true');document.body.append(progress);
let scheduled=false;function drawProgress(){scheduled=false;const length=document.documentElement.scrollHeight-innerHeight;progress.style.setProperty('--reading-progress',length>0?Math.max(0,Math.min(1,scrollY/length)):0);document.documentElement.classList.toggle('page-has-scrolled',scrollY>24);}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(drawProgress);}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});addEventListener('load',schedule,{once:true});if('ResizeObserver' in window)new ResizeObserver(schedule).observe(document.body);drawProgress();
/* Native dialog keeps focus and Escape behavior intact. Original links remain usable without JS. */
if(typeof HTMLDialogElement==='undefined')return;
const viewer=document.createElement('dialog');viewer.className='motion-viewer';viewer.setAttribute('aria-label','Photograph viewer');
viewer.innerHTML='<div class="motion-viewer-top"><span>Closer Look</span><button type="button" class="motion-viewer-close" aria-label="Close photograph viewer">Close ×</button></div><div class="motion-viewer-stage"><img alt=""></div><div class="motion-viewer-bottom"><p class="motion-viewer-caption"></p><a class="motion-viewer-original" target="_blank" rel="noopener">Open Original ↗</a></div><div class="motion-viewer-navigation"><button type="button" data-viewer-prev aria-label="Previous photograph">← Previous</button><span data-viewer-count></span><button type="button" data-viewer-next aria-label="Next photograph">Next →</button></div>';
document.body.append(viewer);
const photo=viewer.querySelector('img'),caption=viewer.querySelector('.motion-viewer-caption'),original=viewer.querySelector('.motion-viewer-original'),count=viewer.querySelector('[data-viewer-count]'),navigation=viewer.querySelector('.motion-viewer-navigation');
const closeButton=viewer.querySelector('.motion-viewer-close');
let group=[],position=0,photoAnimation=null;
function stopPhotoAnimation(){photoAnimation?.cancel();photoAnimation=null;}
function revealPhoto(){
 if(!viewer.open||!photo.hasAttribute('data-photo-pending')||!photo.complete)return;
 photo.removeAttribute('data-photo-pending');
 if(photo.naturalWidth&&!reduce.matches&&photo.animate){
  photoAnimation=photo.animate([{opacity:.55,transform:'scale(.99)'},{opacity:1,transform:'scale(1)'}],{duration:240,easing:'ease-out'});
 }
}
function show(index){
 if(!group.length)return;
 stopPhotoAnimation();
 position=(index+group.length)%group.length;
 const anchor=group[position],img=anchor.querySelector('img');
 photo.setAttribute('data-photo-pending','');
 photo.alt=img.alt;photo.src=anchor.href;
 caption.textContent=anchor.closest('figure')?.querySelector('figcaption')?.textContent.trim()||img.alt||'Photograph';
 original.href=anchor.href;
 count.textContent=(position+1)+' / '+group.length;
 navigation.hidden=group.length<2;
 revealPhoto();
}
function resetViewer(){
 stopPhotoAnimation();group=[];position=0;
 photo.removeAttribute('src');photo.removeAttribute('data-photo-pending');photo.alt='';
 original.removeAttribute('href');caption.textContent=count.textContent='';
 navigation.hidden=true;viewer.scrollTop=0;
 document.documentElement.classList.remove('motion-viewer-open');
}
function close(){if(viewer.open)viewer.close();resetViewer();}
photo.addEventListener('load',revealPhoto);
photo.addEventListener('error',revealPhoto);
closeButton.addEventListener('click',close);
viewer.addEventListener('click',event=>{if(event.target===viewer)close();});
viewer.addEventListener('cancel',event=>{event.preventDefault();close();});
viewer.addEventListener('close',()=>{if(!viewer.open)resetViewer();});
reduce.addEventListener('change',()=>{if(reduce.matches)stopPhotoAnimation();});
addEventListener('pagehide',close);
document.addEventListener('site-access-changed',()=>{
 if(!document.documentElement.hasAttribute('data-access-unlocked')&&group.some(anchor=>anchor.hasAttribute('data-protected-href')))close();
});
viewer.querySelector('[data-viewer-prev]').addEventListener('click',()=>show(position-1));viewer.querySelector('[data-viewer-next]').addEventListener('click',()=>show(position+1));viewer.addEventListener('keydown',event=>{if(group.length>1&&event.key==='ArrowRight'){event.preventDefault();show(position+1);}if(group.length>1&&event.key==='ArrowLeft'){event.preventDefault();show(position-1);}});
const pictureSelector='.academic-figure-link,.city-photo-card>a,a.honor-photo,.news-photo-figure>a';
document.addEventListener('click',event=>{
 if(viewer.open||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
 const anchor=event.target.closest(pictureSelector);
 if(!anchor||!anchor.querySelector('img'))return;
 const imageUrl=new URL(anchor.href,location.href);
 if(!/\.(jpe?g|png|webp|gif|avif|svg)$/i.test(imageUrl.pathname))return;
 event.preventDefault();
 const gallery=anchor.closest('[data-photo-gallery]');
 group=gallery?[...gallery.querySelectorAll('a[href]')].filter(a=>a.querySelector('img')):[anchor];
 viewer.showModal();
 document.documentElement.classList.add('motion-viewer-open');
 show(Math.max(0,group.indexOf(anchor)));
 closeButton.focus();
});
})();
