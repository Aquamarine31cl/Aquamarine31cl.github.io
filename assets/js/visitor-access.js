(() => {
'use strict';
const dialog=document.getElementById('access-dialog');if(!dialog)return;
const scope=dialog.dataset.accessScope;
const access={
 site:{
  digest:'4527b7b28937d4523a4ec170de8e9eff79644b2614e07f458ba79895f6705b97',
  message:'This part of the site is unlocked in this tab.'
 },
 creative:{
  digest:'ba2f1ffecc49f78882ab23b3ac3b8b12a11bb70525c2cd1c1f47aa8a745e98ce',
  message:'Online Posts and Portfolio are unlocked in this tab.'
 },
 personal:{
  digest:'d2afda62e7daaf09793e8e9492a8d44747bdd6d5c8c0d381bfd5227479f78caf',
  message:'Your shop list is unlocked in this tab.'
 }
}[scope];
if(!access)return;
const key=`aquamarine.access.${scope}.v2`;
const expected=access.digest;
const form=dialog.querySelector('form'),input=dialog.querySelector('input'),feedback=dialog.querySelector('[role="status"]');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let unlocked=false,pending=null,trigger=null,resume=null;
try{unlocked=sessionStorage.getItem(key)===expected;}catch{}

// Render the public alias initially; restore the owner's name only in an unlocked tab.
const publicName='Aquamarine';
const privateName=String.fromCharCode(89,117,97,110,112,101,110,103,32,89,101);
function applyNames(){
 const name=unlocked&&scope==='site'?privateName:publicName;
 document.querySelectorAll('[data-private-name]').forEach(el=>{if(el.textContent!==name)el.textContent=name;});
}

function apply(){
 if(!unlocked)document.querySelectorAll('.news-archive').forEach(el=>el.open=false);
 applyNames();
 document.documentElement.toggleAttribute('data-access-unlocked',unlocked);
 document.querySelectorAll('.preview-access-prompt').forEach(el=>el.hidden=unlocked);
 document.querySelectorAll('[data-protected-href]').forEach(a=>{
  a.href=unlocked?a.dataset.protectedHref:'#access-dialog';a.classList.toggle('access-is-locked',!unlocked);
  a.querySelectorAll('.access-photo-veil').forEach(veil=>veil.hidden=unlocked);
 });
 document.querySelectorAll('[data-protected-src]').forEach(img=>{
  if(unlocked){if(img.getAttribute('src')!==img.dataset.protectedSrc)img.src=img.dataset.protectedSrc;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}
 });
 document.querySelectorAll('[data-protected-section]').forEach(el=>el.hidden=!unlocked);
 document.querySelectorAll('[data-daily-prompt]').forEach(el=>el.hidden=unlocked);
 document.querySelectorAll('[data-open-access]').forEach(el=>{if(!el.dataset.lockedLabel)el.dataset.lockedLabel=el.textContent.trim();el.textContent=unlocked?'Manage access':el.dataset.lockedLabel;});
 dialog.querySelector('[data-relock]').hidden=!unlocked;
 form.hidden=unlocked;
 document.dispatchEvent(new CustomEvent('site-access-changed'));
}
function open(el){
 trigger=el;feedback.textContent=unlocked?access.message:'';
 input.value='';dialog.showModal();if(!unlocked)input.focus();else dialog.querySelector('[data-relock]').focus();
}
function close(){dialog.close();pending=null;resume=null;if(trigger?.isConnected)trigger.focus({preventScroll:true});}
document.addEventListener('click',e=>{
 const link=e.target.closest('[data-protected-href]');
 if(link&&!unlocked){e.preventDefault();e.stopImmediatePropagation();pending=link;open(link);return;}
 const button=e.target.closest('[data-open-access]');if(button){pending=null;open(button);}
},true);
dialog.querySelector('[data-close-access]').addEventListener('click',close);
dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
form.addEventListener('submit',async e=>{
 e.preventDefault();const submit=form.querySelector('button');submit.disabled=true;
 try{
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(input.value.trim().toUpperCase()));
  const actual=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
  if(actual!==expected){feedback.textContent='That code did not match. Please try again.';input.select();return;}
  unlocked=true;try{sessionStorage.setItem(key,expected);}catch{}
  const destination=pending,after=resume;resume=null;apply();close();if(after)after();
  if(!destination&&!after&&trigger&&!trigger.getClientRects().length)document.querySelector('.site-access-button')?.focus({preventScroll:true});
  if(destination&&['paper','chapter','external'].includes(destination.dataset.accessKind))location.assign(destination.dataset.protectedHref);
  else if(destination)destination.focus({preventScroll:true});
 }catch{feedback.textContent='Verification is unavailable. Please open the HTTPS website and try again.';}
 finally{submit.disabled=false;}
});
dialog.querySelector('[data-relock]').addEventListener('click',()=>{
 unlocked=false;try{sessionStorage.removeItem(key);}catch{}apply();feedback.textContent='This tab is locked again.';input.focus();
});
apply();
window.addEventListener('pageshow',event=>{
 if(!event.persisted)return;
 try{unlocked=sessionStorage.getItem(key)===expected;}catch{unlocked=false;}
 if(dialog.open)close();
 apply();previews();
});

function previews(){
 document.querySelectorAll('[data-preview-list]').forEach(list=>{
  if(list.closest('[data-protected-section]'))return;
  const count=Array.from(list.querySelectorAll('[data-preview-item]')).filter(el=>el.closest('[data-preview-list]')===list).length;
  if(!count)return;
  let prompt=list.nextElementSibling?.classList.contains('preview-access-prompt')?list.nextElementSibling:null;
  if(!prompt){
   prompt=document.createElement('div');prompt.className='preview-access-prompt';
   const button=document.createElement('button');button.type='button';button.setAttribute('data-open-access','');button.textContent='Enter access code';prompt.append(button);list.insertAdjacentElement('afterend',prompt);
  }
  prompt.hidden=unlocked;
 });
}
previews();
let previewScheduled=false;
new MutationObserver(()=>{if(!previewScheduled){previewScheduled=true;requestAnimationFrame(()=>{previewScheduled=false;previews();});}}).observe(document.body,{childList:true,subtree:true});
document.addEventListener('site-access-request',e=>{
 if(unlocked){e.detail.resume();return;}
 pending=null;resume=e.detail.resume;open(document.activeElement);
});

// Local visitor information: no IP lookup, cookies or external tracking requests.
const corner=document.querySelector('.visitor-corner');
if(corner){
 let activity={visits:0,hearts:0};
 try{const saved=JSON.parse(localStorage.getItem('aquamarine.visitor.v1')||'null');if(saved)activity={visits:Number(saved.visits)||0,hearts:Number(saved.hearts)||0};}catch{}
 try{if(!sessionStorage.getItem('aquamarine.visit.counted')){activity.visits++;sessionStorage.setItem('aquamarine.visit.counted','1');}}catch{activity.visits++;}
 const persist=()=>{try{localStorage.setItem('aquamarine.visitor.v1',JSON.stringify(activity));}catch{}};
 function render(){corner.querySelector('[data-visit-count]').textContent=activity.visits;corner.querySelector('[data-heart-count]').textContent=activity.hearts;}
 persist();render();
 corner.querySelector('[data-visitor-greeting]').textContent=activity.visits>1?'Welcome back.':'Welcome.';
 const clock=()=>{const now=new Date();corner.querySelector('time').dateTime=now.toISOString();corner.querySelector('time').textContent=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});};clock();setInterval(clock,60000);
 let lastHeart=0;
 corner.querySelector('[data-send-heart]').addEventListener('click',e=>{
  if(Date.now()-lastHeart<250)return;lastHeart=Date.now();activity.hearts++;persist();render();
  document.dispatchEvent(new CustomEvent('sky-heart',{detail:{count:activity.hearts}}));
  corner.querySelector('[data-heart-status]').textContent='Thank you! '+activity.hearts+' hearts sent on this browser.';
  if(!reduce.matches){const spark=document.createElement('span');spark.className='visitor-heart-spark';spark.textContent='✧';spark.setAttribute('aria-hidden','true');e.currentTarget.append(spark);spark.addEventListener('animationend',()=>spark.remove(),{once:true});}
 });
 window.addEventListener('storage',e=>{if(e.key==='aquamarine.visitor.v1'&&e.newValue){try{const next=JSON.parse(e.newValue);activity.visits=Number(next.visits)||0;activity.hearts=Number(next.hearts)||0;render();}catch{}}});
}
const top=document.querySelector('.journey-top'),ring=top.querySelector('.journey-top-progress');let scheduled=false;
function progress(){scheduled=false;const max=document.documentElement.scrollHeight-innerHeight;const p=max>0?Math.min(1,scrollY/max):0;top.hidden=scrollY<500;ring.style.strokeDashoffset=String(106.814*(1-p));}
addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(progress);}},{passive:true});
addEventListener('resize',progress);top.addEventListener('click',()=>scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'}));progress();
})();
