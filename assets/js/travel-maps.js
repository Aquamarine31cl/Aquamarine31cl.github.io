(() => {
'use strict';
const root = document.querySelector('.travel-atlas'); if (!root) return;
const statuses = root.querySelectorAll('[data-status]');
const fail = () => statuses.forEach(el => { el.textContent = 'The map could not load. Please refresh and try again.'; });
if (!window.L) { fail(); return; }
const text = value => String(value == null ? '' : value);
const popup = (title, note, year) => { const box = document.createElement('div'); const heading = document.createElement('strong'); heading.textContent = title; box.append(heading); [year, note].filter(Boolean).forEach(value => { const line = document.createElement('p'); line.textContent = text(value); box.append(line); }); return box; };
const validCity = c => c && typeof c.name === 'string' && Number.isFinite(c.lat) && Number.isFinite(c.lng) && Math.abs(c.lat) <= 90 && Math.abs(c.lng) <= 180;
const unique = values => [...new Map(values.map(v => [v.region_key || (v.name.toLowerCase() + ':' + v.lat + ':' + v.lng), v])).values()];
(async () => {
try {
 const data = JSON.parse(document.getElementById('travel-data').dataset.json);
 const response = await fetch(root.dataset.worldUrl); if (!response.ok) throw Error('Map unavailable'); const geo = await response.json();
 const journeys = (data.journeys || []).map(j => ({region_key:j.region_key,name:j.city,lat:j.lat,lng:j.lng,country:j.country,country_code:j.country_code,year:j.arrival,note:j.description,scope:j.scope}));
 const china = unique([...(data.china_cities || []), ...journeys.filter(j=>j.scope==='china')].filter(validCity));
 const world = unique([...(data.world_cities || []), ...china, ...journeys.filter(j=>j.scope==='world')].filter(validCity));
  const countryRecords = new Map((data.world_countries || []).filter(c => c && /^[A-Z]{3}$/.test(c.code)).map(c => [c.code,c]));
 world.forEach(c => { if (/^[A-Z]{3}$/.test(c.country_code) && !countryRecords.has(c.country_code)) countryRecords.set(c.country_code,{name:c.country || c.country_code,code:c.country_code}); });
 for (const id of ['china','world']) {
  const cities = id === 'china' ? china : world;
  const map = L.map('travel-map-' + id, {scrollWheelZoom:false, minZoom:1, maxZoom:8, zoomSnap:0.25, worldCopyJump:false});
  map.attributionControl.addAttribution('Map data: <a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  const reset = () => id === 'china' ? map.fitBounds([[18,73],[54,135]],{padding:[15,15],animate:false}) : map.fitBounds([[-55,-175],[80,175]],{padding:[10,10],animate:false}); reset();
  const baseStyle = f => { const active = id === 'china' ? f.properties.code === 'CHN' : countryRecords.has(f.properties.code); return {color:active ? '#d2c3ff' : '#7f86ad',weight:active ? 1.1 : .7,fillColor:active ? '#a995ee' : '#343750',fillOpacity:active ? .85 : .8}; };
  const countries = L.geoJSON(geo,{style:baseStyle,onEachFeature:(feature,layer) => {
   layer.bindTooltip(feature.properties.name,{sticky:true});
   if (id === 'world') { const visit = countryRecords.get(feature.properties.code);layer.bindPopup(popup(feature.properties.name,visit ? visit.note || 'Visited' : 'No visits recorded.',visit && visit.year)); }
   layer.on('mouseover',()=>layer.setStyle({weight:1.5,color:'#d2c3ff'}));layer.on('mouseout',()=>countries.resetStyle(layer));
  }}).addTo(map);
  const list = root.querySelector('[data-places="' + id + '"]');
  cities.forEach(city => { const marker = L.marker([city.lat,city.lng],{icon:L.divIcon({className:'travel-pin',html:'<span></span>',iconSize:[18,18],iconAnchor:[9,9]}),title:city.name,keyboard:true}).addTo(map).bindPopup(popup(city.name,city.note,city.year));const button=document.createElement('button');button.type='button';button.textContent=city.name;button.addEventListener('click',()=>{map.setView([city.lat,city.lng],Math.max(map.getZoom(),4),{animate:!window.matchMedia('(prefers-reduced-motion: reduce)').matches});marker.openPopup();});list.append(button); });
  if (id === 'world') countryRecords.forEach(country => { const button=document.createElement('button');button.type='button';button.textContent=country.name || country.code;button.addEventListener('click',()=>{let found=false;countries.eachLayer(layer=>{if(layer.feature.properties.code===country.code){found=true;map.fitBounds(layer.getBounds(),{maxZoom:4,animate:false});layer.openPopup();}});if(!found){const city=cities.find(c=>c.country_code===country.code);if(city){map.setView([city.lat,city.lng],5,{animate:false});L.popup().setLatLng([city.lat,city.lng]).setContent(popup(country.name || country.code,'Visited')).openOn(map);}}});list.append(button); });
  root.querySelector('[data-count="'+id+'"]').textContent=id==='china' ? cities.length+' destinations' : countryRecords.size+' countries · '+cities.length+' destinations';
  root.querySelector('[data-status="'+id+'"]').textContent=cities.length || (id==='world' && countryRecords.size) ? 'Select a marker or place below to explore. Drag to pan; use + / − to zoom.' : 'No visits recorded yet. Drag to explore; use + / − to zoom.';
  const resetButton=root.querySelector('[data-reset="'+id+'"]');resetButton.disabled=false;resetButton.addEventListener('click',reset);
  if ('ResizeObserver' in window) new ResizeObserver(()=>map.invalidateSize()).observe(map.getContainer());
 }
 root.dataset.ready='true';
} catch(error) { fail(); }
})();
})();