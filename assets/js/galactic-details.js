(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 const selector='.home-education,.home-news,.home-honors,.experience-hero,.online-group,.portfolio-section,.visitor-corner,.travel-map-card';
 const sections=Array.from(document.querySelectorAll(selector));
 const patterns=['8,30 25,14 47,24 64,6 83,21','10,12 31,24 50,8 66,31 86,18','9,25 28,7 46,27 68,14 86,28'];
 sections.forEach((el,i)=>{
  el.classList.add('galactic-section');
  const stars=document.createElementNS('http://www.w3.org/2000/svg','svg');stars.classList.add('section-constellation');stars.setAttribute('viewBox','0 0 96 40');stars.setAttribute('aria-hidden','true');
  const points=patterns[i%3],line=document.createElementNS(stars.namespaceURI,'polyline');line.setAttribute('points',points);stars.append(line);
  points.split(' ').forEach((p,j)=>{const c=document.createElementNS(stars.namespaceURI,'circle'),[x,y]=p.split(',');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r',j%2?1.6:1.1);c.style.animationDelay=(-j*.8-i*.4)+'s';stars.append(c);});el.append(stars);
  let raf=0,x=50,y=30;
  el.addEventListener('pointermove',e=>{if(!fine.matches||reduced.matches)return;const r=el.getBoundingClientRect();x=(e.clientX-r.left)/r.width*100;y=(e.clientY-r.top)/r.height*100;if(!raf)raf=requestAnimationFrame(()=>{raf=0;el.style.setProperty('--galaxy-x',x+'%');el.style.setProperty('--galaxy-y',y+'%');});},{passive:true});
 });
 function clear(){sections.forEach(el=>{el.style.removeProperty('--galaxy-x');el.style.removeProperty('--galaxy-y');});}
 addEventListener('pagehide',clear);addEventListener('pageshow',clear);
})();
