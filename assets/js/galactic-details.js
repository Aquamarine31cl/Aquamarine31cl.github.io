(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const selector='.home-education,.home-news,.home-honors,.experience-hero,.online-group,.portfolio-section,.visitor-corner,.travel-map-card';
 const sections=Array.from(document.querySelectorAll(selector));
 const patterns=['8,30 25,14 47,24 64,6 83,21','10,12 31,24 50,8 66,31 86,18','9,25 28,7 46,27 68,14 86,28'];
 const resetSections=sections.map((el,i)=>{
  el.classList.add('galactic-section');
  const stars=document.createElementNS('http://www.w3.org/2000/svg','svg');stars.classList.add('section-constellation');stars.setAttribute('viewBox','0 0 96 40');stars.setAttribute('aria-hidden','true');
  const points=patterns[i%3],line=document.createElementNS(stars.namespaceURI,'polyline');line.setAttribute('points',points);stars.append(line);
  points.split(' ').forEach((p,j)=>{const c=document.createElementNS(stars.namespaceURI,'circle'),[x,y]=p.split(',');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',j%2?1.6:1.1);c.style.animationDelay=(-j*.8-i*.4)+'s';stars.append(c);});el.append(stars);
  let raf=0,x=0,y=0;
  el.addEventListener('pointermove',event=>{
   if(event.pointerType!=='mouse'||!fine.matches||reduced.matches||document.hidden)return;
   x=event.clientX;y=event.clientY;
   if(raf)return;
   raf=requestAnimationFrame(()=>{
    raf=0;
    const rect=el.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    el.style.setProperty('--galaxy-x',(x-rect.left)/rect.width*100+'%');
    el.style.setProperty('--galaxy-y',(y-rect.top)/rect.height*100+'%');
   });
  },{passive:true});
  function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;}
  el.addEventListener('pointerleave',cancel);
  return ()=>{cancel();el.style.removeProperty('--galaxy-x');el.style.removeProperty('--galaxy-y');};
 });
 function clear(){resetSections.forEach(reset=>reset());}
 addEventListener('pagehide',clear);addEventListener('pageshow',clear);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 reduced.addEventListener('change',clear);fine.addEventListener('change',clear);
})();
