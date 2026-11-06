/* Fleet tactics: action-point movement, line of sight, directional shields and telegraphed missiles. */
(() => {
'use strict';
class MeridianFleet{
 constructor(){this.reset();}
 reset(){
  this.traces=[];this.round=1;this.phase='player';this.progress=0;this.selected=0;this.target={x:4,y:4};this.logs=['Secure both relay zones for eight signal points, or eliminate the hostile fleet.'];this.missiles=[];this.nextId=6;
  this.rocks=new Set(['4,1','4,2','5,2','3,5','4,5','5,6','6,6','7,3']);
  this.ships=[{id:0,team:0,type:'Vanguard',x:1,y:3,hp:90,shield:35,range:4,damage:25},{id:1,team:0,type:'Lancer',x:0,y:5,hp:65,shield:20,range:7,damage:32},{id:2,team:0,type:'Warden',x:1,y:6,hp:85,shield:40,range:3,damage:20},{id:3,team:1,type:'Raider',x:9,y:3,hp:65,shield:25,range:4,damage:22},{id:4,team:1,type:'Raider',x:10,y:5,hp:65,shield:25,range:4,damage:22},{id:5,team:1,type:'Dreadnought',x:9,y:7,hp:110,shield:45,range:5,damage:28}].map(s=>({...s,ap:4,heat:0,facing:s.team?Math.PI:0,watch:false}));
 }
 note(s){this.logs.unshift(s);this.logs=this.logs.slice(0,7);}
 distance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
 occupied(x,y){return this.ships.find(s=>s.hp>0&&s.x===x&&s.y===y);}
 passable(x,y){return x>=0&&x<12&&y>=0&&y<10&&!this.rocks.has(`${x},${y}`)&&!this.occupied(x,y);}
 sight(a,b){let x=a.x,y=a.y,dx=Math.abs(b.x-x),dy=-Math.abs(b.y-y),sx=x<b.x?1:-1,sy=y<b.y?1:-1,err=dx+dy;while(x!==b.x||y!==b.y){const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}if(this.rocks.has(`${x},${y}`))return false;}return true;}
 path(a,b){const queue=[{x:a.x,y:a.y}],visited=new Map([[`${a.x},${a.y}`,null]]);for(let i=0;i<queue.length;i++){const cur=queue[i];if(cur.x===b.x&&cur.y===b.y){const out=[];let key=`${cur.x},${cur.y}`;while(visited.get(key)){out.unshift(queue.find(p=>`${p.x},${p.y}`===key));key=visited.get(key);}return out;}for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=cur.x+dx,y=cur.y+dy,key=`${x},${y}`;if(!visited.has(key)&&this.passable(x,y)){visited.set(key,`${cur.x},${cur.y}`);queue.push({x,y});}}}return null;}
 current(){return this.ships.find(s=>s.id===this.selected&&s.team===0&&s.hp>0);}
 valid(s,cost){if(this.phase!=='player'||!s){this.note('Select an operational friendly vessel.');return false;}if(s.ap<cost){this.note('Not enough action points. End the fleet turn to replenish.');return false;}return true;}
 damage(attacker,target,amount){const angle=Math.atan2(attacker.y-target.y,attacker.x-target.x),facing=Math.cos(angle-target.facing),front=facing>.1;let hit=amount;if(front){const absorb=Math.min(target.shield,hit);target.shield-=absorb;hit-=absorb;}else hit=Math.round(hit*1.25);target.hp=Math.max(0,target.hp-hit);if(target.hp===0)this.note(target.type+' destroyed.');}
 fire(s,t,watch=false){if(!t||s.team===t.team||this.distance(s,t)>s.range||!this.sight(s,t))return false;if(s.heat>65)return false;this.traces.push({x1:s.x,y1:s.y,x2:t.x,y2:t.y});this.damage(s,t,s.damage);s.heat+=30;s.facing=Math.atan2(t.y-s.y,t.x-s.x);if(!watch)s.ap-=2;return true;}
 move(){const s=this.current(),route=s&&this.path(s,this.target);if(!route||!route.length){this.note('No clear route to that sector.');return false;}if(!this.valid(s,route.length))return false;for(const p of route){s.facing=Math.atan2(p.y-s.y,p.x-s.x);s.x=p.x;s.y=p.y;s.ap--;for(const enemy of this.ships.filter(e=>e.team!==s.team&&e.hp>0&&e.watch)){if(this.fire(enemy,s,true))enemy.watch=false;}if(s.hp<=0)break;}this.note(s.type+' repositioned.');this.check();return true;}
 shoot(){const s=this.current(),t=this.occupied(this.target.x,this.target.y);if(!this.valid(s,2))return false;if(!this.fire(s,t)){this.note('Fire requires an enemy in range, clear sight and heat at or below 65.');return false;}this.note(s.type+' fired. Side and rear attacks bypass shields.');this.check();return true;}
 missile(){const s=this.current();if(!this.valid(s,3))return false;if(s.heat>65||this.distance(s,this.target)>8){this.note('Missile range is 8; cool your weapons below 66 heat.');return false;}s.ap-=3;s.heat+=40;this.missiles.push({x:this.target.x,y:this.target.y,team:0,round:this.round+1});this.note('Missile marked: impact next round, radius 1. Avoid friendly fire.');return true;}
 brace(){const s=this.current();if(!this.valid(s,2))return false;s.ap-=2;s.shield=Math.min(s.type==='Warden'?60:45,s.shield+22);s.heat=Math.max(0,s.heat-25);s.facing=Math.atan2(this.target.y-s.y,this.target.x-s.x);this.note('Shields restored; facing the selected sector.');return true;}
 overwatch(){const s=this.current();if(!this.valid(s,2))return false;s.ap-=2;s.watch=true;this.note('Overwatch armed: first enemy moving into range triggers a shot.');return true;}
 check(){if(!this.ships.some(s=>s.team===0&&s.hp>0)){this.phase='lost';this.note('Fleet lost. Use cover, shield facing and coordinated fire.');}else if(!this.ships.some(s=>s.team===1&&s.hp>0)||this.progress>=8){this.phase='won';this.note('Meridian network secured. Victory.');}else if(this.round>18){this.phase='lost';this.note('The signal window closed after round 18.');}}
 end(){
  if(this.phase!=='player')return false;this.phase='enemy';
  for(const e of this.ships.filter(s=>s.team===1&&s.hp>0)){
   e.ap=4;e.watch=false;e.heat=Math.max(0,e.heat-30);let targets=this.ships.filter(s=>s.team===0&&s.hp>0).sort((a,b)=>this.distance(e,a)-this.distance(e,b));if(!targets.length)break;
   let t=targets[0];
   while(e.ap>2&&(this.distance(e,t)>e.range||!this.sight(e,t))){const options=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(p=>this.passable(p.x,p.y)).sort((a,b)=>this.distance(a,t)-this.distance(b,t));if(!options.length)break;const p=options[0];e.facing=Math.atan2(p.y-e.y,p.x-e.x);e.x=p.x;e.y=p.y;e.ap--;for(const s of this.ships.filter(s=>s.team===0&&s.hp>0&&s.watch)){if(this.fire(s,e,true))s.watch=false;}if(e.hp<=0)break;}
   if(e.hp>0&&e.ap>=2&&!this.fire(e,t)){e.watch=true;}
  }
  this.round++;
  for(const m of this.missiles.filter(m=>m.round<=this.round)){for(const s of this.ships.filter(s=>s.hp>0))if(this.distance(m,s)<=1){s.hp=Math.max(0,s.hp-42);s.shield=Math.max(0,s.shield-15);}this.note('Missile impact at '+m.x+','+m.y+'.');}
  this.missiles=this.missiles.filter(m=>m.round>this.round);
  for(const s of this.ships.filter(s=>s.hp>0)){s.ap=4;s.heat=Math.max(0,s.heat-25);if(s.team===0)s.watch=false;}
  let held=0;for(const z of [{x:5,y:4},{x:7,y:7}]){const allies=this.ships.some(s=>s.team===0&&s.hp>0&&this.distance(s,z)<=1),enemy=this.ships.some(s=>s.team===1&&s.hp>0&&this.distance(s,z)<=1);if(allies&&!enemy)held++;}this.progress+=held;
  if([6,10].includes(this.round)){const spawn={x:11,y:0};if(this.passable(spawn.x,spawn.y)){this.ships.push({id:this.nextId++,team:1,type:'Interceptor',...spawn,hp:55,shield:20,range:5,damage:20,ap:4,heat:0,facing:Math.PI,watch:false});this.note('Enemy reinforcements entered the eastern boundary.');}}
  this.phase='player';this.check();if(!this.current())this.selected=this.ships.find(s=>s.team===0&&s.hp>0)?.id??0;this.note('Round '+this.round+' · '+held+' uncontested relay zones.');return true;
 }
}
globalThis.MeridianFleet=MeridianFleet;
const root=typeof document!=='undefined'?document.querySelector('[data-meridian]'):null;if(!root)return;
const game=new MeridianFleet(),board=root.querySelector('[data-fleet-board]'),tiles=[];
for(let y=0;y<10;y++)for(let x=0;x<12;x++){const b=document.createElement('button');b.type='button';b.dataset.x=x;b.dataset.y=y;b.setAttribute('role','gridcell');b.addEventListener('click',()=>{const s=game.occupied(x,y);if(s?.team===0)game.selected=s.id;game.target={x,y};render();});b.addEventListener('keydown',e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!d)return;e.preventDefault();const nx=x+d[0],ny=y+d[1];if(nx>=0&&nx<12&&ny>=0&&ny<10)tiles[ny*12+nx].focus();});board.append(b);tiles.push(b);}
function render(){const s=game.current();root.querySelector('[data-fleet-hud]').textContent=`Round ${game.round}/18 · Signal ${game.progress}/8 · Friendly ${game.ships.filter(s=>s.team===0&&s.hp>0).length} · Hostile ${game.ships.filter(s=>s.team===1&&s.hp>0).length}`;
 root.querySelector('[data-fleet-detail]').textContent=s?`${s.type}: hull ${s.hp}, shield ${s.shield}, AP ${s.ap}/4, heat ${s.heat}, range ${s.range}${s.watch?' · OVERWATCH':''}. Target ${game.target.x},${game.target.y}.`:'No vessel selected.';
 for(const b of tiles){const x=+b.dataset.x,y=+b.dataset.y,t=game.occupied(x,y),rock=game.rocks.has(`${x},${y}`),relay=(x===5&&y===4)||(x===7&&y===7),incoming=game.missiles.some(m=>game.distance(m,{x,y})<=1);b.className=[rock?'fleet-rock':'',relay?'fleet-relay':'',incoming?'fleet-danger':'',t?(t.team?'fleet-enemy':'fleet-ally'):''].join(' ');b.textContent=rock?'▰':t?(t.type==='Lancer'?'➶':t.type==='Warden'?'◈':t.team?'▼':'▲'):relay?'✦':'';if(t){const small=document.createElement('small');const arrows=['→','↘','↓','↙','←','↖','↑','↗'];small.textContent=arrows[(Math.round(t.facing/(Math.PI/4))+8)%8]+' '+t.hp;b.append(small);}b.setAttribute('aria-selected',String(s?.x===x&&s?.y===y));b.setAttribute('data-target',String(game.target.x===x&&game.target.y===y));b.setAttribute('aria-label',`Sector ${x},${y}, ${t?t.type+', hull '+t.hp+', shield '+t.shield:rock?'asteroid':relay?'relay':'empty'}${incoming?', incoming missile':''}`);b.tabIndex=game.target.x===x&&game.target.y===y?0:-1;}
 board.querySelector('.fleet-overlay')?.remove();if(game.traces.length){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 600 500');svg.setAttribute('class','fleet-overlay');svg.setAttribute('aria-hidden','true');for(const t of game.traces){const l=document.createElementNS(svg.namespaceURI,'line');for(const [key,v] of Object.entries({x1:t.x1*50+25,y1:t.y1*50+25,x2:t.x2*50+25,y2:t.y2*50+25}))l.setAttribute(key,v);svg.append(l);}board.append(svg);game.traces=[];}const log=root.querySelector('[data-fleet-log]');log.replaceChildren(...game.logs.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));root.querySelector('[data-fleet-status]').textContent=game.phase==='won'?'Victory — Meridian secured.':game.phase==='lost'?'Fleet campaign ended. Restart to try again.':game.logs[0];root.querySelectorAll('[data-fleet-action]').forEach(b=>b.disabled=game.phase!=='player');}
root.querySelectorAll('[data-fleet-action]').forEach(b=>b.addEventListener('click',()=>{game[b.dataset.fleetAction]();render();}));root.querySelector('[data-fleet-restart]').addEventListener('click',()=>{game.reset();render();});render();
})();
