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
document.body.append(dialog);const map=dialog.querySelector('.sky-atlas-map'),caption=dialog.querySelector('.sky-atlas-caption');let opener;
for(const [id,label,url,note,x,y] of entries){
 const a=document.createElement('a');a.className='sky-atlas-node';a.href=url;a.dataset.discovery=id;a.style.left=x+'%';a.style.top=y+'%';a.innerHTML='<span aria-hidden="true">✦</span><span>'+label+'</span>';
 a.addEventListener('pointerenter',()=>caption.textContent=note);a.addEventListener('focus',()=>caption.textContent=note);map.append(a);
}
function update(){let found=[];try{found=JSON.parse(localStorage.getItem('aquamarine.sky.collection.v1')||'[]');}catch{}dialog.querySelectorAll('[data-discovery]').forEach(a=>{const yes=Array.isArray(found)&&found.includes(a.dataset.discovery);a.classList.toggle('is-found',yes);a.setAttribute('aria-label',a.textContent.trim()+(yes?' - discovered':' - not yet discovered'));});}
function open(button){opener=button;update();dialog.showModal();dialog.querySelector('.sky-atlas-close').focus();}
function close(){dialog.close();opener?.focus({preventScroll:true});}
dialog.querySelector('.sky-atlas-close').addEventListener('click',close);dialog.addEventListener('cancel',e=>{e.preventDefault();close();});dialog.addEventListener('click',e=>{if(e.target===dialog)close();});document.addEventListener('sky-collection-change',update);
const corner=document.querySelector('.visitor-corner .visitor-controls');
if(corner){
 const actions=document.createElement('div');actions.className='sky-actions';
 const atlas=document.createElement('button');atlas.type='button';atlas.textContent='Explore My Star Atlas';atlas.addEventListener('click',()=>open(atlas));
 const wish=document.createElement('button');wish.type='button';wish.className='sky-wish-button';wish.textContent='Hold to Make a Wish';wish.setAttribute('aria-label','Make a wish. Hold with the pointer, or press Enter or Space.');
 let timer=0,lastWish=0;
 function cancel(){clearTimeout(timer);timer=0;wish.removeAttribute('data-charging');}
 function release(){cancel();if(Date.now()-lastWish<2200)return;lastWish=Date.now();announce('A wish released - a comet carries it into the galaxy.',true);}
 wish.addEventListener('pointerdown',e=>{if(e.button!==0)return;cancel();wish.setPointerCapture(e.pointerId);wish.dataset.charging='';timer=setTimeout(release,700);});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>wish.addEventListener(type,cancel));wish.addEventListener('click',e=>{if(e.detail===0)release();});
 addEventListener('blur',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
 actions.append(atlas,wish);corner.append(actions);
}
const hero=document.querySelector('.experience-hero');
if(hero&&document.querySelector('.art-moon')){
 const button=document.createElement('button');button.type='button';button.className='sky-alignment';button.textContent='Align the Planets ✧';let cooldown=0;
 button.addEventListener('click',()=>{if(Date.now()-cooldown<7500)return;cooldown=Date.now();document.dispatchEvent(new CustomEvent('sky-alignment'));announce(reduce.matches?'Three worlds, one constellation.':'Three worlds find a moment of alignment.');});hero.append(button);
}
})();
