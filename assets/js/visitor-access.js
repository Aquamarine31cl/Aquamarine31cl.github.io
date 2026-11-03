(() => {
'use strict';
const dialog=document.getElementById('access-dialog');if(!dialog)return;
const key='aquamarine.access.v1',expected='be8cdbb4dfc3a009bbcc8f09ea09ac98760c624f1a22e1e8227473dae44c19b4';
const form=dialog.querySelector('form'),input=dialog.querySelector('input'),feedback=dialog.querySelector('[role="status"]');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
let unlocked=false,pending=null,trigger=null,resume=null;
try{unlocked=sessionStorage.getItem(key)===expected;}catch{}

// Render the public alias initially; restore the owner's name only in an unlocked tab.
const publicName='Aquamarine';
const privateName=String.fromCharCode(89,117,97,110,112,101,110,103,32,89,101);
const namePattern=/\bAquamarine\b/g;
function applyNames(){
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
  return node.parentElement?.closest('script,style,textarea,[data-name-private]')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;
 }});
 while(walker.nextNode()){
  const node=walker.currentNode;
  const text=unlocked?node.data.replace(namePattern,privateName):node.data.split(privateName).join(publicName);
  if(node.data!==text)node.data=text;
 }
 document.querySelectorAll('[alt],[title],[aria-label],meta[content]').forEach(el=>{
  if(el.closest('[data-name-private]'))return;
  for(const attr of ['alt','title','aria-label','content']){
   if(!el.hasAttribute(attr))continue;
   const old=el.getAttribute(attr),next=unlocked?old.replace(namePattern,privateName):old.split(privateName).join(publicName);
   if(old!==next)el.setAttribute(attr,next);
  }
 });
 const baseTitle=window.aquamarinePublicationTitle?(unlocked?window.aquamarinePublicationTitle:'Publications'):document.title;
 const title=unlocked?baseTitle.replace(namePattern,privateName):baseTitle.split(privateName).join(publicName);
 if(document.title!==title)document.title=title;
}

function apply(){
 if(!unlocked)document.querySelectorAll('.news-archive').forEach(el=>el.open=false);
 applyNames();
 document.documentElement.toggleAttribute('data-access-unlocked',unlocked);
 document.querySelectorAll('.preview-access-prompt').forEach(el=>el.hidden=unlocked);
 document.querySelectorAll('[data-protected-href]').forEach(a=>{
  a.href=unlocked?a.dataset.protectedHref:'#access-dialog';a.classList.toggle('access-is-locked',!unlocked);
  a.querySelectorAll('[data-protected-src]').forEach(img=>{
   if(unlocked){img.src=img.dataset.protectedSrc;img.hidden=false;}else{img.removeAttribute('src');img.hidden=true;}
  });
  a.querySelectorAll('.access-photo-veil').forEach(veil=>veil.hidden=unlocked);
 });
 document.querySelectorAll('[data-protected-section]').forEach(el=>el.hidden=!unlocked);
 document.querySelectorAll('[data-daily-prompt]').forEach(el=>el.hidden=unlocked);
 document.querySelectorAll('[data-open-access]').forEach(el=>el.textContent=unlocked?'Access Unlocked · Manage ↗':el.closest('.daily-access-prompt')?'Unlock Daily':'Unlock Photos & Daily ↗');
 dialog.querySelector('[data-relock]').hidden=!unlocked;
 form.hidden=unlocked;
 document.dispatchEvent(new CustomEvent('site-access-changed'));
}
function open(el){
 trigger=el;feedback.textContent=unlocked?'Photos, Daily and paper downloads are unlocked in this tab.':'';
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
  if(destination&&['paper','chapter','external'].includes(destination.dataset.accessKind))location.assign(destination.dataset.protectedHref);
  else if(destination)destination.focus({preventScroll:true});
 }catch{feedback.textContent='Verification is unavailable. Please open the HTTPS website and try again.';}
 finally{submit.disabled=false;}
});
dialog.querySelector('[data-relock]').addEventListener('click',()=>{
 unlocked=false;try{sessionStorage.removeItem(key);}catch{}apply();feedback.textContent='This tab is locked again.';input.focus();
});
apply();

function previews(){
 document.querySelectorAll('[data-preview-list]').forEach(list=>{
  const count=Array.from(list.querySelectorAll('[data-preview-item]')).filter(el=>el.closest('[data-preview-list]')===list).length;
  if(!count)return;
  let prompt=Array.from(list.children).find(el=>el.classList.contains('preview-access-prompt'));
  if(!prompt){
   prompt=document.createElement(list.tagName==='OL'||list.tagName==='UL'?'li':'div');prompt.className='preview-access-prompt';
   const button=document.createElement('button');button.type='button';button.setAttribute('data-open-access','');button.textContent='Unlock the Full Collection ↗';prompt.append(button);list.append(prompt);
  }
  prompt.hidden=unlocked;
 });
}
previews();
let previewScheduled=false;
new MutationObserver(()=>{if(!previewScheduled){previewScheduled=true;requestAnimationFrame(()=>{previewScheduled=false;previews();applyNames();});}}).observe(document.body,{childList:true,subtree:true});
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
 corner.querySelector('[data-visitor-greeting]').textContent=activity.visits>1?'Welcome back. There is always more to discover.':'Welcome, fellow explorer. Make yourself at home.';
 const clock=()=>{const now=new Date();corner.querySelector('time').dateTime=now.toISOString();corner.querySelector('time').textContent=now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});};clock();setInterval(clock,60000);
 let lastHeart=0;
 corner.querySelector('[data-send-heart]').addEventListener('click',e=>{
  if(Date.now()-lastHeart<250)return;lastHeart=Date.now();activity.hearts++;persist();render();
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
