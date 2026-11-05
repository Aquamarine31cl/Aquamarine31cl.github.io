(() => {
 'use strict';
 const size=10,entrance=30,exit=39;
 const adjacent=i=>[i-10,i+10,i%10?i-1:-1,i%10<9?i+1:-1].filter(j=>j>=0&&j<100);
 class RelaySiege {
  constructor(){this.reset();}
  reset(){this.phase='build';this.credits=140;this.lives=15;this.wave=0;this.towers=new Map();this.enemies=[];this.effects=[];this.selected=44;this.mode='laser';this.clock=0;this.remaining=0;this.timer=0;this.message='Build towers, then launch the first wave.';}
  distances(){
   const distances=Array(100).fill(Infinity),queue=[exit];distances[exit]=0;
   for(let n=0;n<queue.length;n++)for(const j of adjacent(queue[n])){
    if(!this.towers.has(j)&&distances[j]===Infinity){distances[j]=distances[queue[n]]+1;queue.push(j);}
   }
   return distances;
  }
  build(){
   if(!['build','wave'].includes(this.phase))return;
   const i=this.selected,cost=this.mode==='laser'?35:50;
   if([entrance,exit].includes(i)||this.towers.has(i)){this.message='Select an empty tile away from the two gates.';return;}
   if(this.enemies.some(e=>e.cell===i||e.target===i)){this.message='An enemy is crossing that tile.';return;}
   if(this.credits<cost){this.message='Insufficient credits.';return;}
   this.towers.set(i,{type:this.mode,level:1,cooldown:0});
   const map=this.distances();
   if(!Number.isFinite(map[entrance])||this.enemies.some(e=>!Number.isFinite(map[e.cell])||!Number.isFinite(map[e.target]))){this.towers.delete(i);this.message='That placement would seal a route. Leave a path to the relay.';return;}
   this.credits-=cost;this.message='Tower built. Enemies will use the shortest open route.';
  }
  upgrade(){
   const tower=this.towers.get(this.selected);
   if(!tower||tower.level===3){this.message='Select a tower below level 3.';return;}
   const cost=tower.level*30;
   if(this.credits<cost){this.message='Insufficient credits.';return;}
   this.credits-=cost;tower.level++;this.message='Tower upgraded to level '+tower.level+'.';
  }
  sell(){
   const tower=this.towers.get(this.selected);if(!tower)return;
   this.credits+=Math.floor(((tower.type==='laser'?35:50)+(tower.level===2?30:tower.level===3?90:0))*.6);
   this.towers.delete(this.selected);this.message='Tower salvaged for 60% of its investment.';
  }
  launch(){if(this.phase!=='build')return;this.wave++;this.remaining=5+this.wave*2;this.timer=0;this.phase='wave';this.message='Wave '+this.wave+' approaching.';}
  step(dt){
   if(this.phase!=='wave')return;dt=Math.min(dt,1/60);this.clock+=dt;this.timer-=dt;
   if(this.remaining&&this.timer<=0){
    const armor=this.wave>=3&&this.remaining%3===0;
    this.enemies.push({cell:entrance,target:entrance,x:.5,y:3.5,progress:0,hp:35+this.wave*14,armor,slow:0,speed:this.remaining%4===0?2.1:1.25});
    this.remaining--;this.timer=.85;
   }
   const distances=this.distances();
   for(const enemy of this.enemies){
    enemy.slow=Math.max(0,enemy.slow-dt);
    if(enemy.cell===enemy.target){enemy.target=adjacent(enemy.cell).filter(i=>!this.towers.has(i)).sort((a,b)=>distances[a]-distances[b]||a-b)[0];enemy.progress=0;}
    enemy.progress+=dt*enemy.speed*(enemy.slow>0?.5:1);
    const t=Math.min(1,enemy.progress),from=enemy.cell,to=enemy.target;
    enemy.x=from%10+.5+(to%10-from%10)*t;enemy.y=Math.floor(from/10)+.5+(Math.floor(to/10)-Math.floor(from/10))*t;
    if(t===1){enemy.cell=enemy.target;if(enemy.cell===exit){enemy.escaped=true;this.lives-=enemy.armor?2:1;}}
   }
   for(const [index,tower] of this.towers){
    tower.cooldown-=dt;if(tower.cooldown>0)continue;
    const x=index%10+.5,y=Math.floor(index/10)+.5,range=2.1+tower.level*.25;
    const target=this.enemies.filter(e=>!e.escaped&&e.hp>0&&Math.hypot(e.x-x,e.y-y)<=range).sort((a,b)=>distances[a.cell]-distances[b.cell])[0];
    if(!target)continue;
    if(tower.type==='laser')target.hp-=Math.max(3,12*tower.level-(target.armor?8:0));
    else{target.hp-=3*tower.level;target.slow=1.3+tower.level*.25;}
    tower.cooldown=tower.type==='laser'?.55:.9;this.effects.push({x,y,tx:target.x,ty:target.y,type:tower.type,life:.12});
   }
   for(const enemy of this.enemies)if(enemy.hp<=0&&!enemy.escaped)this.credits+=8+(enemy.armor?5:0);
   this.enemies=this.enemies.filter(e=>!e.escaped&&e.hp>0);this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
   if(this.lives<=0){this.lives=0;this.phase='lost';this.message='Relay destroyed. Rebuild your maze and tower mix.';}
   else if(!this.remaining&&!this.enemies.length){this.credits+=35;this.phase=this.wave===6?'won':'build';this.message=this.phase==='won'?'Relay secure. Six waves defeated.':'Wave clear. Refine the route before the next attack.';}
  }
 }
 globalThis.RelaySiege=RelaySiege;
 const root=document.querySelector('[data-relay-siege]');if(!root)return;
 const model=new RelaySiege(),status=root.querySelector('[role=status]'),hud=root.querySelector('[data-siege-hud]');
 const grid=root.querySelector('[data-siege-grid]');let frame=0,last=0,paused=false,lastMessage='',accumulator=0;
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
 overlay.setAttribute('viewBox','0 0 100 100');overlay.setAttribute('aria-hidden','true');overlay.classList.add('siege-overlay');
 const cells=Array.from({length:100},(_,i)=>{
  const b=document.createElement('button');b.type='button';b.setAttribute('role','gridcell');
  b.addEventListener('click',()=>{model.selected=i;draw();});grid.append(b);return b;
 });
 grid.append(overlay);
 function draw(){
  const map=model.distances(),route=new Set();let at=entrance;
  for(let n=0;n<100&&at!==exit;n++){route.add(at);at=adjacent(at).filter(i=>!model.towers.has(i)).sort((a,b)=>map[a]-map[b])[0];if(at===undefined)break;}
  cells.forEach((b,i)=>{
   const tower=model.towers.get(i),enemies=model.enemies.filter(e=>e.cell===i);
   b.textContent=tower?(tower.type==='laser'?'L':'S')+tower.level:enemies.length?'◆':i===entrance?'IN':i===exit?'OUT':route.has(i)?'·':'';
   b.dataset.tile=tower?tower.type:enemies.length?'enemy':route.has(i)?'route':'empty';
   b.setAttribute('aria-selected',String(model.selected===i));
   b.setAttribute('aria-label',String.fromCharCode(65+i%10)+(Math.floor(i/10)+1)+', '+(tower?tower.type+' tower level '+tower.level:enemies.length?'enemy present':i===entrance?'entry':i===exit?'relay':'empty'));
  });
  const visuals=[];
  for(const enemy of model.enemies){
   const dot=document.createElementNS(overlay.namespaceURI,'circle');
   dot.setAttribute('cx',enemy.x*10);dot.setAttribute('cy',enemy.y*10);dot.setAttribute('r',enemy.armor?1.7:1.3);dot.setAttribute('fill',enemy.armor?'#ffe0ab':'#ff93a9');visuals.push(dot);
  }
  if(!motion.matches)for(const effect of model.effects){
   const beam=document.createElementNS(overlay.namespaceURI,'line');
   for(const [name,value] of Object.entries({x1:effect.x*10,y1:effect.y*10,x2:effect.tx*10,y2:effect.ty*10,stroke:effect.type==='laser'?'#ffc4ad':'#b3faff','stroke-width':.35}))beam.setAttribute(name,value);
   visuals.push(beam);
  }
  overlay.replaceChildren(...visuals);
  hud.textContent='Wave '+model.wave+' / 6 · Integrity '+model.lives+' / 15 · Credits '+model.credits+' · Hostiles '+(model.enemies.length+model.remaining);
  if(lastMessage!==model.message){status.textContent=model.message;lastMessage=model.message;}
  root.querySelector('[data-siege-launch]').disabled=model.phase!=='build';
  root.querySelector('[data-siege-pause]').disabled=model.phase!=='wave';
  root.querySelector('[data-siege-pause]').textContent=paused?'Resume Wave':'Pause Wave';
  for(const b of root.querySelectorAll('[data-siege-action]'))b.disabled=!['build','wave'].includes(model.phase);
 }
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;accumulator=0;}
 function tick(now){
  frame=0;if(paused||document.hidden||model.phase!=='wave')return;
  accumulator+=last?Math.min(.08,(now-last)/1000):0;last=now;
  while(accumulator>=1/120){model.step(1/120);accumulator-=1/120;}
  draw();if(model.phase==='wave')frame=requestAnimationFrame(tick);
 }
 function sync(){stop();draw();if(!paused&&!document.hidden&&model.phase==='wave')frame=requestAnimationFrame(tick);}
 for(const b of root.querySelectorAll('[data-siege-mode]'))b.addEventListener('click',()=>{model.mode=b.dataset.siegeMode;root.querySelectorAll('[data-siege-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button===b)));});
 for(const b of root.querySelectorAll('[data-siege-action]'))b.addEventListener('click',()=>{model[b.dataset.siegeAction]();draw();});
 root.querySelector('[data-siege-launch]').addEventListener('click',()=>{model.launch();paused=false;sync();});
 root.querySelector('[data-siege-pause]').addEventListener('click',()=>{paused=!paused;sync();});
 root.querySelector('[data-siege-restart]').addEventListener('click',()=>{model.reset();paused=false;sync();});
 grid.addEventListener('keydown',event=>{
  const offsets={ArrowUp:-10,ArrowDown:10,ArrowLeft:-1,ArrowRight:1};
  if(!Object.hasOwn(offsets,event.key))return;
  event.preventDefault();const index=cells.indexOf(event.target),next=index+offsets[event.key];
  if(next>=0&&next<100&&(Math.abs(offsets[event.key])===10||Math.floor(next/10)===Math.floor(index/10))){cells[next].focus();model.selected=next;draw();}
 });
 function suspend(){paused=true;sync();}
 addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
 addEventListener('pagehide',()=>{paused=true;stop();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)suspend();}).observe(grid);
 draw();
})();
