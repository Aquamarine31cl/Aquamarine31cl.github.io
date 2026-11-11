(() => {
'use strict';
const root=document.querySelector('[data-helios]');if(!root)return;
const game=new HeliosAccord(),ns='http://www.w3.org/2000/svg';
const board=root.querySelector('[data-helios-board]'),hud=root.querySelector('[data-helios-hud]'),detail=root.querySelector('[data-helios-detail]'),log=root.querySelector('[data-helios-log]');
const element=(tag,attrs={},text='')=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));e.textContent=text;return e;};
const point=t=>({x:320+69*(t.q+t.r/2),y:255+60*t.r});
const tileNodes=new Map();
const scenario=root.querySelector('[data-helios-scenario]');
const preview=root.querySelector('[data-helios-preview]');
const undo=root.querySelector('[data-helios-undo]');
const signed=value=>value>0?'+'+value:String(value);
function atRisk(tile,next){
 return Boolean(tile.kind&&next&&(!next.kind||next.hp<tile.hp));
}
const links=element('g',{'class':'helios-links','aria-hidden':'true'});board.append(links);
for(const [id,t] of game.tiles){
 const {x,y}=point(t),g=element('g',{role:'button',tabindex:'-1','data-sector':id,transform:`translate(${x} ${y})`});
 const polygon=element('polygon',{points:'0,-38 33,-19 33,19 0,38 -33,19 -33,-19'});
 const label=element('text',{y:4,'text-anchor':'middle','class':'helios-symbol'}),sub=element('text',{y:24,'text-anchor':'middle','class':'helios-sub'});
 g.append(polygon,label,sub);board.append(g);tileNodes.set(id,{g,label,sub});
 const select=()=>{game.selected=id;render();};g.addEventListener('click',select);
 g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}else{const dir={ArrowRight:[1,0],ArrowLeft:[-1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!dir)return;e.preventDefault();const next=`${t.q+dir[0]},${t.r+dir[1]}`;if(tileNodes.has(next)){game.selected=next;render();tileNodes.get(next).g.focus();}}});
}
function render(){
 const next=game.projectCycle();
 const coreAtRisk=next&&next.integrity<game.integrity;
 const damaged=next?[...game.tiles].filter(([id,tile])=>atRisk(tile,next.tiles.get(id))).length:0;
 preview.hidden=!next;
 if(next)preview.textContent='Next cycle: '+signed(next.alloy-game.alloy)+' alloy · '+signed(next.energy-game.energy)+' energy · '+signed(next.science-game.science)+' science'+(coreAtRisk?' · Core −'+(game.integrity-next.integrity)+'%':'')+(damaged?' · '+damaged+' modules at risk':'');
 undo.disabled=!game.previousOrder;
 hud.textContent=`Cycle ${game.turn}/36 · Alloy ${game.alloy} · Energy ${game.energy} · Science ${game.science} · Core ${game.integrity}% · Beacons ${game.beacons}/3`;
 const f=game.forecast;root.querySelector('[data-helios-forecast]').textContent=`Next: cycle ${f.cycle} · ${f.storm?'SOLAR FLARE — impact '+f.strength:'quiet skies'} · sun sector ${f.sun+1} · ${game.actionUsed?'order used':'one order available'}`;
 for(const [id,t] of game.tiles){const {g,label,sub}=tileNodes.get(id);const risk=atRisk(t,next?.tiles.get(id))||(id==='0,0'&&coreAtRisk);g.toggleAttribute('data-helios-risk',Boolean(risk));g.setAttribute('aria-pressed',String(game.selected===id));g.setAttribute('tabindex',game.selected===id?'0':'-1');g.setAttribute('class',[t.kind?'occupied':'',t.online?'online':'',t.powered?'powered':'',t.heat>24?'hot':''].join(' '));g.setAttribute('aria-label',`Sector ${id}, ${t.kind==='core'?'Core':HeliosModules[t.kind]?.name||'empty'}, ore ${t.ore}, heat ${Math.round(t.heat)}${risk?', projected damage next cycle':''}`);label.textContent=t.kind==='core'?'✦':HeliosModules[t.kind]?.symbol||'·';sub.textContent=t.kind?`${t.kind==='core'?'CORE':'L'+t.level} ${t.kind==='core'?game.integrity:Math.ceil(t.hp)}%`:'ORE '+t.ore;}
 links.replaceChildren();for(const [id,t] of game.tiles)if(t.online)for(const n of game.neighbors(t))if(n.online&&id<`${n.q},${n.r}`){const a=point(t),b=point(n);links.append(element('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y}));}
 const t=game.tiles.get(game.selected);detail.textContent=`Sector ${game.selected}: ${t.kind==='core'?'Command Core':HeliosModules[t.kind]?.name||'Empty'} · ${t.ore} ore remaining · ${Math.round(t.heat)} heat${t.kind?' · '+(t.online?'connected':'DISCONNECTED')+(t.powered?' · powered':' · idle'):''}.`;
 log.replaceChildren(...game.log.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
 for(const b of root.querySelectorAll('[data-helios-build],[data-helios-order],[data-helios-tech]')){
  const spec=HeliosModules[b.dataset.heliosBuild];
  b.disabled=game.phase!=='playing'||game.actionUsed||Boolean(spec&&(t.kind||game.alloy<spec.cost||!game.neighbors(t).some(neighbor=>neighbor.online)));
  if(b.dataset.heliosOrder==='launch'){
   const alloy=38+game.beacons*12,science=18+game.beacons*8;
   b.disabled||=game.alloy<alloy||game.science<science||game.energy<20;
   b.textContent=game.beacons===3?'All Beacons Launched':'Launch Beacon · '+alloy+' alloy / '+science+' science / 20 energy';
  }
 }
 root.querySelector('[data-helios-next]').disabled=game.phase!=='playing';
 root.querySelector('[data-helios-status]').textContent=game.phase==='won'?'Victory — the Helios Accord is online.':game.phase==='lost'?'Campaign ended. Restart to try a different plan.':game.log[0];
}
root.querySelectorAll('[data-helios-build]').forEach(b=>b.addEventListener('click',()=>{game.build(b.dataset.heliosBuild);render();}));
root.querySelectorAll('[data-helios-order]').forEach(b=>b.addEventListener('click',()=>{game[b.dataset.heliosOrder]();render();}));
root.querySelectorAll('[data-helios-tech]').forEach(b=>b.addEventListener('click',()=>{game.research(b.dataset.heliosTech);render();}));
root.querySelector('[data-helios-next]').addEventListener('click',()=>{game.step();render();});
undo.addEventListener('click',()=>{game.undoOrder();render();});
root.querySelector('[data-helios-restart]').addEventListener('click',()=>{game.reset(scenario.value);render();});
render();
})();
