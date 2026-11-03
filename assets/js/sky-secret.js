(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');let letters='',last=0,timer=0;
 document.addEventListener('keydown',e=>{
  if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.target.closest('input,textarea,select,[contenteditable]')||e.key.length!==1)return;
  const now=Date.now();if(now-last>1800)letters='';last=now;letters=(letters+e.key.toLowerCase()).slice(-8);
  if(letters!=='stardust')return;letters='';
  document.dispatchEvent(new CustomEvent('sky-surprise',{detail:{message:'Stardust remembers the curious. A quiet aurora answers.',strong:true}}));
  if(!reduce.matches){document.documentElement.setAttribute('data-secret-aurora','');clearTimeout(timer);timer=setTimeout(()=>document.documentElement.removeAttribute('data-secret-aurora'),7000);}
 });
 addEventListener('pagehide',()=>{clearTimeout(timer);document.documentElement.removeAttribute('data-secret-aurora');letters='';});
})();
