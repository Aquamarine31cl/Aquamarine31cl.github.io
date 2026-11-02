(() => {
'use strict';
document.querySelectorAll('[data-photo-gallery]').forEach(gallery=>{
const panels=[...gallery.querySelectorAll('[data-photo-panel]')];
const buttons=[...gallery.querySelectorAll('[data-photo-select]')];
buttons.forEach(button=>button.addEventListener('click',()=>{const index=button.dataset.photoSelect;panels.forEach(panel=>panel.hidden=panel.dataset.photoPanel!==index);buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
});
})();
