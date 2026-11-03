(() => {
'use strict';
const root=document.querySelector('.travel-atlas');if(!root)return;
const data=JSON.parse(document.getElementById('travel-data').dataset.json);
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const popup=(title,note)=>{const box=document.createElement('div');const h=document.createElement('strong');h.textContent=title;box.append(h);if(note){const p=document.createElement('p');p.textContent=note;box.append(p);}return box;};
const load=async url=>{const r=await fetch(url);if(!r.ok)throw Error('Map unavailable');return r.json();};
const journeys=data.journeys||[];
let highlightTimer;
const revealJourney=city=>{
 const card=document.getElementById('journey-'+city.id);if(!card)return;
 root.ownerDocument.querySelectorAll('[data-map-highlight]').forEach(el=>el.removeAttribute('data-map-highlight'));
 clearTimeout(highlightTimer);card.setAttribute('data-map-highlight','');
 card.setAttribute('tabindex','-1');card.focus({preventScroll:true});
 card.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'center'});
 highlightTimer=setTimeout(()=>card.removeAttribute('data-map-highlight'),2000);
};

// Random decorative particles are masked out of every land polygon, including a coastal margin.
function addOceanStars(map,geo){
 const canvas=document.createElement('canvas');canvas.className='travel-map-stardust';canvas.setAttribute('aria-hidden','true');
 map.getContainer().append(canvas);
 const ctx=canvas.getContext('2d'),mask=document.createElement('canvas'),mc=mask.getContext('2d');
 if(!ctx||!mc){canvas.remove();return;}
 let width=0,height=0,stars=[],frame=0,last=0,time=0,visible=true,moving=false;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 function geometry(g){
  if(!g)return;
  if(g.type==='GeometryCollection'){g.geometries.forEach(geometry);return;}
  const polygons=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
  polygons.forEach(poly=>{
   mc.beginPath();
   poly.forEach(ring=>ring.forEach((p,i)=>{
    const q=map.latLngToContainerPoint([p[1],p[0]]);
    if(i===0)mc.moveTo(q.x,q.y);else mc.lineTo(q.x,q.y);
    if(i===ring.length-1)mc.closePath();
   }));
   mc.fill('evenodd');mc.stroke();
  });
 }
 function rebuild(){
  const size=map.getSize();width=size.x;height=size.y;
  canvas.width=mask.width=width;canvas.height=mask.height=height;
  mc.fillStyle='#000';mc.strokeStyle='#000';mc.lineWidth=16;mc.lineJoin='round';
  (geo.features||[geo]).forEach(f=>geometry(f.geometry||f));
  const pixels=mc.getImageData(0,0,width,height).data;
  const sea=(x,y)=>pixels[(Math.floor(y)*width+Math.floor(x))*4+3]===0;
  stars=[];
  const count=Math.min(48,Math.max(18,Math.floor(width*height/14000)));
  for(let n=0;n<count;n++){
   let x=0,y=0,found=false;
   for(let k=0;k<90;k++){x=5+Math.random()*Math.max(1,width-10);y=5+Math.random()*Math.max(1,height-10);if(sea(x,y)){found=true;break;}}
   if(found)stars.push({x,y,r:.6+Math.random()*.9,vx:(Math.random()-.5)*7,vy:-1.5-Math.random()*4,
    phase:Math.random()*Math.PI*2,speed:1.4+Math.random()*2.3,life:Math.random()*5});
  }
  moving=false;canvas.style.visibility='visible';paint(0);start();
 }
 function paint(dt){
  time+=dt;ctx.clearRect(0,0,width,height);
  for(const s of stars){
   s.x=(s.x+s.vx*dt+width)%width;s.y=(s.y+s.vy*dt+height)%height;
   const pulse=(1+Math.sin(time*s.speed+s.phase))/2;
   ctx.globalAlpha=.15+.8*pulse;
   const glow=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*5);
   glow.addColorStop(0,'#ffe7ae');glow.addColorStop(.25,'#eec77599');glow.addColorStop(1,'#eec77500');
   ctx.fillStyle=glow;ctx.beginPath();ctx.arc(s.x,s.y,s.r*5,0,Math.PI*2);ctx.fill();
   ctx.fillStyle='#ffedbf';ctx.beginPath();ctx.arc(s.x,s.y,s.r*(.65+.35*pulse),0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';ctx.drawImage(mask,0,0);ctx.globalCompositeOperation='source-over';
 }
 function tick(now){frame=0;if(now-last>=32){paint(last?Math.min((now-last)/1000,.08):0);last=now;}start();}
 function start(){if(!frame&&!motion.matches&&!document.hidden&&visible&&!moving)frame=requestAnimationFrame(tick);}
 function stop(){if(frame)cancelAnimationFrame(frame);frame=0;last=0;}
 function sync(){stop();if(motion.matches)paint(0);start();}
 const onMove=()=>{moving=true;canvas.style.visibility='hidden';stop();};
 map.on('movestart zoomstart',onMove);map.on('moveend zoomend resize',rebuild);
 document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
 const observer='IntersectionObserver'in window?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}):null;
 if(observer)observer.observe(canvas);
 map.on('unload',()=>{stop();observer?.disconnect();document.removeEventListener('visibilitychange',sync);motion.removeEventListener('change',sync);canvas.remove();});
 rebuild();
}

async function render(id){
const status=root.querySelector('[data-status="'+id+'"]');
try{
if(!window.L)throw Error('Map library unavailable');
const cities=journeys.filter(j=>j.scope===(id==='china'?'china':'world'));
if(id==='china')cities.sort((a,b)=>Number(a.adcode)-Number(b.adcode));
const list=root.querySelector('[data-places="'+id+'"]');
const map=L.map('travel-map-'+id,{scrollWheelZoom:false,doubleClickZoom:false,minZoom:1,maxZoom:10,zoomSnap:.25});
map.attributionControl.addAttribution(id==='china'?'Boundaries: <a href="https://datav.aliyun.com/portal/school/atlas/area_selector">DataV GeoAtlas</a>':'Map data: <a href="https://www.naturalearthdata.com/">Natural Earth</a>');
const reset=()=>map.fitBounds(id==='china'?[[3,73],[54,136]]:[[-55,-175],[80,175]],{padding:[12,12],animate:false});reset();
const button=(name,action)=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.addEventListener('click',action);list.append(b);return b;};
if(id==='china'){
const [regions,outline]=await Promise.all([load(root.dataset.chinaUrl),load(root.dataset.outlineUrl)]);
const visited=new Map(cities.map(j=>[Number(j.adcode),j]));const layers=new Map();
const isSpecial=code=>visited.get(code)?.highlight==='gold';
const style=f=>({color:'#525b70',weight:.55,fillColor:isSpecial(f.properties.adcode)?'#e9bc59':visited.has(f.properties.adcode)?'#b39af4':'#49515f',fillOpacity:visited.has(f.properties.adcode)?.94:.85});
const areas=L.geoJSON(regions,{style,onEachFeature:(f,layer)=>{const visit=visited.get(f.properties.adcode);layer.options.className=visit?(isSpecial(f.properties.adcode)?'visited-prefecture special-prefecture':'visited-prefecture'):'unvisited-prefecture';layers.set(f.properties.adcode,layer);layer.bindTooltip(visit?visit.city:'Not yet visited',{sticky:true});layer.bindPopup(popup(visit?visit.city:'Not yet visited'));if(visit)layer.on('dblclick',()=>{map.closePopup();revealJourney(visit);});layer.on('mouseover',()=>layer.setStyle({weight:1.5,color:'#ece0ff'}));layer.on('mouseout',()=>areas.resetStyle(layer));}}).addTo(map);
L.geoJSON(outline,{interactive:false,style:{color:'#e9d9ff',weight:2,fill:false,opacity:1,className:'china-outer-outline'}}).addTo(map);
cities.forEach(city=>{const control=button(city.city,()=>{const layer=layers.get(Number(city.adcode));if(layer){map.fitBounds(layer.getBounds(),{maxZoom:7,animate:!reduced()});layer.openPopup();}});});
root.querySelector('[data-count="china"]').textContent=visited.size+' destinations';
addOceanStars(map,regions);
root.dataset.chinaVisited=visited.size;
}else{
const geo=await load(root.dataset.worldUrl);addOceanStars(map,geo);const countries=new Map((data.world_countries||[]).map(c=>[c.code,c]));const layers=new Map();
const style=f=>({color:'#6d7588',weight:.7,fillColor:countries.has(f.properties.code)?'#b39af4':'#49515f',fillOpacity:countries.has(f.properties.code)?.95:.85});
const areas=L.geoJSON(geo,{style,onEachFeature:(f,layer)=>{const visited=countries.has(f.properties.code);layers.set(f.properties.code,layer);layer.bindTooltip(f.properties.name,{sticky:true});layer.bindPopup(popup(f.properties.name,visited?'Visited':'Not yet visited'));if(visited)layer.on('dblclick',e=>{const matches=cities.filter(c=>c.country_code===f.properties.code);matches.sort((a,b)=>map.distance(e.latlng,[a.lat,a.lng])-map.distance(e.latlng,[b.lat,b.lng]));if(matches[0]){map.closePopup();revealJourney(matches[0]);}});layer.on('mouseover',()=>layer.setStyle({weight:1.5,color:'#ece0ff'}));layer.on('mouseout',()=>areas.resetStyle(layer));}}).addTo(map);
countries.forEach(c=>button(c.name,()=>{const layer=layers.get(c.code);if(layer){map.fitBounds(layer.getBounds(),{maxZoom:7,animate:false});layer.openPopup();}}));
cities.forEach(city=>{if(!Number.isFinite(city.lat)||!Number.isFinite(city.lng))return;const marker=L.marker([city.lat,city.lng],{icon:L.divIcon({className:'travel-pin',html:'<span></span>',iconSize:[18,18],iconAnchor:[9,9]}),title:city.city}).addTo(map).bindPopup(popup(city.city));marker.on('dblclick',()=>{map.closePopup();revealJourney(city);});button(city.city,()=>{map.setView([city.lat,city.lng],5,{animate:!reduced()});marker.openPopup();});});
root.querySelector('[data-count="world"]').textContent=countries.size+' countries · '+cities.length+' destinations';
root.dataset.worldVisited=countries.size;
}
status.textContent='Select a region or place to explore. Drag to pan; use + / − to zoom.';
const resetButton=root.querySelector('[data-reset="'+id+'"]');resetButton.disabled=false;resetButton.addEventListener('click',reset);
if('ResizeObserver' in window)new ResizeObserver(()=>map.invalidateSize()).observe(map.getContainer());
}catch(error){status.textContent='The map could not load. Please refresh and try again.';}
}
Promise.all([render('china'),render('world')]);
})();
