/* Non-interactive ornament layers; navigation remains native links. */
(() => {
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const fine=matchMedia('(hover: hover) and (pointer: fine)');
const headings=document.querySelectorAll('.page__title,.honors-section-heading h2,.home-education>h2,.travel-atlas>header h3,.travel-journal-header h3');
headings.forEach(heading=>{heading.classList.add('ornamented-heading');const orbit=document.createElement('span');orbit.className='heading-orbit';orbit.setAttribute('aria-hidden','true');heading.append(orbit);});
const frames=document.querySelectorAll('.home-intro,.research-ribbon,.education-card,.honor-feature,.news-photo-card,.academic-card,.experience-choice,.city-journey,.travel-map-card,.experience-entry');
frames.forEach(frame=>{frame.classList.add('ornamented-frame');const trim=document.createElement('span');trim.className='surface-trim';trim.setAttribute('aria-hidden','true');const sweep=document.createElement('span');sweep.className='surface-sweep';sweep.setAttribute('aria-hidden','true');frame.append(trim,sweep);frame.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'&&fine.matches&&!reduce.matches&&!frame.hasAttribute('data-sweep-running'))frame.setAttribute('data-sweep-running','');});frame.addEventListener('animationend',event=>{if(event.animationName==='frame-edge-pass')frame.removeAttribute('data-sweep-running');});});
reduce.addEventListener('change',()=>{if(reduce.matches)frames.forEach(frame=>frame.removeAttribute('data-sweep-running'));});
const nav=document.querySelector('#site-nav');if(!nav)return;
nav.classList.add('ornamented-nav');const visible=nav.querySelector('.visible-links'),hidden=nav.querySelector('.hidden-links');
const candidates=[...nav.querySelectorAll('.masthead__menu-item:not(.masthead__menu-item--lg):not(#theme-toggle)>a[href]')];
const path=location.pathname.replace(/\/$/,'')||'/';let current=null;
for(const link of candidates){const destination=new URL(link.href,location.href).pathname.replace(/\/$/,'')||'/';if(destination===path||(destination!=='/'&&path.startsWith(destination+'/'))){current=link;link.setAttribute('aria-current','page');}}
const indicator=document.createElement('span');indicator.className='nav-orbit-indicator';indicator.setAttribute('aria-hidden','true');nav.append(indicator);
let pending=0,preferred=null;
function place(link){if(!link||!visible.contains(link)||!link.getClientRects().length){indicator.removeAttribute('data-visible');return;}const box=link.getBoundingClientRect(),parent=nav.getBoundingClientRect();indicator.style.width=box.width+'px';indicator.style.height=box.height+'px';indicator.style.transform='translate3d('+(box.left-parent.left)+'px,'+(box.top-parent.top)+'px,0)';indicator.dataset.visible='true';}
function schedule(){if(pending)return;pending=requestAnimationFrame(()=>{pending=0;place(preferred||current);const button=nav.querySelector(':scope>button');if(button&&hidden)button.setAttribute('aria-expanded',String(!hidden.classList.contains('hidden')));});}
nav.addEventListener('pointerover',event=>{const link=event.target.closest('.visible-links .masthead__menu-item:not(.masthead__menu-item--lg):not(#theme-toggle)>a');if(link){preferred=link;schedule();}});
nav.addEventListener('pointerleave',()=>{preferred=null;schedule();});
nav.addEventListener('focusin',event=>{if(candidates.includes(event.target)){preferred=event.target;schedule();}});
nav.addEventListener('focusout',()=>{preferred=null;schedule();});
addEventListener('resize',schedule,{passive:true});addEventListener('load',schedule,{once:true});reduce.addEventListener('change',schedule);
if('ResizeObserver' in window)new ResizeObserver(schedule).observe(nav);
if(visible)new MutationObserver(schedule).observe(visible,{childList:true});if(hidden)new MutationObserver(schedule).observe(hidden,{childList:true,attributes:true,attributeFilter:['class']});
const theme=nav.querySelector('#theme-toggle>a');if(theme)theme.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();theme.click();}});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);schedule();
})();
