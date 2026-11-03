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
 highlightTimer=setTimeout(()=>card.removeAttribute('data-map-highlight'),4500);
};
async function render(id){
const status=root.querySelector('[data-status="'+id+'"]');
try{
if(!window.L)throw Error('Map library unavailable');
const cities=journeys.filter(j=>j.scope===(id==='china'?'china':'world'));
if(id==='china')cities.sort((a,b)=>Number(a.adcode)-Number(b.adcode));
const list=root.querySelector('[data-places="'+id+'"]');
const map=L.map('travel-map-'+id,{scrollWheelZoom:false,doubleClickZoom:false,minZoom:1,maxZoom:10,zoomSnap:.25});
map.attributionControl.addAttribution(id==='china'?'Boundaries: <a href="https://datav.aliyun.com/portal/school/atlas/area_selector">DataV GeoAtlas</a>':'Map data: <a href="https://www.naturalearthdata.com/">Natural Earth</a>');
const dust=document.createElement('div');dust.className='travel-map-stardust';dust.setAttribute('aria-hidden','true');map.getContainer().append(dust);
const goldDot=city=>{if(!Number.isFinite(city.lat)||!Number.isFinite(city.lng))return;L.marker([city.lat,city.lng],{interactive:false,keyboard:false,icon:L.divIcon({className:'travel-gold-dot',html:'<span></span>',iconSize:[12,12],iconAnchor:[6,6]})}).addTo(map);};
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
cities.forEach(goldDot);
root.dataset.chinaVisited=visited.size;
}else{
const geo=await load(root.dataset.worldUrl);const countries=new Map((data.world_countries||[]).map(c=>[c.code,c]));const layers=new Map();
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
