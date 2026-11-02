(() => {
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('[data-photo-gallery]').forEach(gallery=>{
const panels=[...gallery.querySelectorAll('[data-photo-panel]')],buttons=[...gallery.querySelectorAll('[data-photo-select]')];let animation=null;
buttons.forEach(button=>button.addEventListener('click',()=>{if(button.getAttribute('aria-pressed')==='true')return;const index=button.dataset.photoSelect;if(animation)animation.cancel();panels.forEach(panel=>panel.hidden=panel.dataset.photoPanel!==index);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));const panel=panels.find(p=>p.dataset.photoPanel===index);if(panel&&!reduce.matches&&panel.animate)animation=panel.animate([{opacity:.35,transform:'translateY(4px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:280,easing:'cubic-bezier(.2,.7,.3,1)'});}));
});
})();
