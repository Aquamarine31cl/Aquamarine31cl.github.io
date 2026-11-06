/* Helios Accord: deterministic, turn-based colony simulation. No timers or network. */
(() => {
 'use strict';
 const directions=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
 const modules={
  solar:{name:'Solar Array',cost:22,draw:0,heat:0,symbol:'☀'},
  mine:{name:'Extractor',cost:26,draw:3,heat:3,symbol:'◆'},
  lab:{name:'Research Lab',cost:34,draw:5,heat:4,symbol:'⌬'},
  shield:{name:'Shield Pylon',cost:30,draw:3,heat:1,symbol:'◈'},
  radiator:{name:'Radiator',cost:18,draw:1,heat:-13,symbol:'❄'},
  relay:{name:'Relay / Battery',cost:12,draw:0,heat:0,symbol:'◇'}
 };
 class HeliosAccord {
  constructor(){this.reset();}
  reset(){
   this.turn=0;this.alloy=130;this.energy=30;this.science=0;this.integrity=100;
   this.beacons=0;this.phase='playing';this.selected='0,0';this.actionUsed=false;
   this.tech={efficiency:0,cooling:0,fortification:0};this.log=['Colony online. Build one module per cycle, then advance time.'];
   this.tiles=new Map();
   for(let q=-3;q<=3;q++)for(let r=-3;r<=3;r++)if(Math.abs(q+r)<=3){
    const ore=60+((q*19+r*31+200)%7)*12;
    this.tiles.set(`${q},${r}`,{q,r,ore,kind:null,level:1,hp:100,heat:0,online:false,powered:false});
   }
   Object.assign(this.tiles.get('0,0'),{kind:'core',online:true,powered:true});
   this.forecast=this.predict();return this;
  }
  neighbors(tile){return directions.map(([q,r])=>this.tiles.get(`${tile.q+q},${tile.r+r}`)).filter(Boolean);}
  network(){
   for(const t of this.tiles.values())t.online=false;
   const core=this.tiles.get('0,0');if(!core.kind)return;
   const queue=[core];core.online=true;
   for(let i=0;i<queue.length;i++)for(const t of this.neighbors(queue[i]))if(t.kind&&!t.online){t.online=true;queue.push(t);}
  }
  note(message){this.log.unshift(message);this.log=this.log.slice(0,8);return message;}
  predict(){const cycle=this.turn+1;return{cycle,storm:cycle%6===0,strength:12+Math.floor(cycle/6)*5,sun:Math.floor(this.turn/3)%6};}
  spendAction(cost){
   if(this.phase!=='playing'){this.note('Restart the campaign to play again.');return false;}
   if(this.actionUsed){this.note('One construction or research order per cycle. Advance the cycle first.');return false;}
   if(this.alloy<cost){this.note('Not enough alloy for this order.');return false;}
   this.alloy-=cost;this.actionUsed=true;return true;
  }
  build(kind){
   const t=this.tiles.get(this.selected),spec=modules[kind];
   if(!t||t.kind||!spec){this.note('Select an empty sector before building.');return false;}
   if(!this.neighbors(t).some(n=>n.online)){this.note('Build adjacent to the connected colony.');return false;}
   if(!this.spendAction(spec.cost))return false;
   t.kind=kind;t.hp=100;t.level=1;t.heat=0;this.network();this.note(spec.name+' commissioned.');return true;
  }
  upgrade(){
   const t=this.tiles.get(this.selected);
   if(!t?.kind||t.kind==='core'||t.level>=3){this.note('Select a module below level 3.');return false;}
   const cost=18*t.level;if(!this.spendAction(cost))return false;
   t.level++;t.hp=Math.min(100,t.hp+30);this.note('Module upgraded to level '+t.level+'.');return true;
  }
  repair(){
   const t=this.tiles.get(this.selected);
   if(!t?.kind||t.kind==='core'){this.note('Select a damaged module; core integrity repairs automatically when cool.');return false;}
   if(!this.spendAction(12))return false;
   t.hp=100;t.heat=Math.max(0,t.heat-20);this.note('Repair drones restored the selected module.');return true;
  }
  salvage(){
   const t=this.tiles.get(this.selected);
   if(!t?.kind||t.kind==='core'){this.note('The command core cannot be salvaged.');return false;}
   if(!this.spendAction(0))return false;
   this.alloy+=Math.floor(modules[t.kind].cost*.6);t.kind=null;t.heat=0;t.powered=false;
   this.network();this.note('Module salvaged. Check for disconnected sectors.');return true;
  }
  research(kind){
   if(!(kind in this.tech)||this.tech[kind]>=2){this.note('Research is already complete.');return false;}
   const science=12+this.tech[kind]*12;
   if(this.science<science){this.note('Research requires '+science+' science and 15 alloy.');return false;}
   if(!this.spendAction(15))return false;
   this.science-=science;this.tech[kind]++;this.note(kind+' research advanced.');return true;
  }
  launch(){
   const alloy=38+this.beacons*12,science=18+this.beacons*8;
   if(this.alloy<alloy||this.science<science||this.energy<20){this.note(`Beacon needs ${alloy} alloy, ${science} science and 20 energy.`);return false;}
   if(!this.spendAction(alloy))return false;
   this.science-=science;this.energy-=20;this.beacons++;this.note('Beacon '+this.beacons+' launched into the Accord network.');
   if(this.beacons===3){this.phase='won';this.note('Accord secured. Three beacons are online.');}
   return true;
  }
  step(){
   if(this.phase!=='playing')return false;
   this.network();const weather=this.forecast,connected=[...this.tiles.values()].filter(t=>t.online);
   let generated=8,demand=0;const sun=directions[weather.sun];
   for(const t of this.tiles.values())t.powered=false;
   for(const t of connected)if(t.kind==='solar'){
    const facing=(t.q*sun[0]+t.r*sun[1])>=0?1:.6;
    const crowd=this.neighbors(t).filter(n=>n.kind==='solar').length;
    generated+=Math.max(2,(11+t.level*3+this.tech.efficiency*2)*facing-crowd*2)*(weather.storm?.5:1);
   }
   this.energy+=Math.floor(generated);
   // Stable priority: cooling and shields before industrial consumers.
   const priority={core:0,radiator:1,shield:2,relay:3,solar:3,mine:4,lab:5};
   connected.sort((a,b)=>priority[a.kind]-priority[b.kind]);
   for(const t of connected){
    if(t.kind==='mine'&&t.ore===0)continue;
    const draw=(modules[t.kind]?.draw||0)*t.level;demand+=draw;
    if(this.energy>=draw){this.energy-=draw;t.powered=true;}
   }
   for(const t of connected){
    if(!t.powered)continue;
    if(t.kind==='mine'){const amount=Math.min(t.ore,7+3*t.level);t.ore-=amount;this.alloy+=amount;}
    if(t.kind==='lab')this.science+=3*t.level;
   }
   // Natural cooling, module production and neighbor heat exchange are synchronous.
   const heat=new Map();
   for(const [id,t] of this.tiles){
    const radiators=this.neighbors(t).filter(n=>n.powered&&n.kind==='radiator').reduce((s,n)=>s+6*n.level,0);
    const neighbors=this.neighbors(t).filter(n=>n.kind);
    const exchange=t.kind&&neighbors.length?neighbors.reduce((s,n)=>s+(n.heat-t.heat)*.08,0):0;
    heat.set(id,Math.max(0,t.heat+(t.powered?(modules[t.kind]?.heat||0)*t.level:0)-2-this.tech.cooling*2-radiators+exchange));
   }
   for(const [id,t] of this.tiles){
    t.heat=heat.get(id);
    if(!t.kind)continue;
    if(t.heat>24)t.hp-=Math.ceil((t.heat-24)*.4);
    if(weather.storm){
     const shields=this.neighbors(t).concat(t).filter(n=>n.powered&&n.kind==='shield').reduce((s,n)=>s+10*n.level,0);
     const hit=Math.max(0,weather.strength-shields-this.tech.fortification*5);
     if(t.kind==='core')this.integrity-=hit;else t.hp-=hit;
    }
    if(t.kind!=='core'&&t.hp<=0){this.note(modules[t.kind].name+' lost: exposed or overheated.');t.kind=null;t.powered=false;}
   }
   const core=this.tiles.get('0,0');
   if(core.heat<16&&!weather.storm)this.integrity=Math.min(100,this.integrity+2);
   this.alloy+=4; // Core fabricator prevents an exhausted deposit from soft-locking play.
   const capacity=45+connected.filter(t=>t.kind==='relay').reduce((s,t)=>s+20*t.level,0);
   this.energy=Math.min(capacity,this.energy);this.turn++;this.actionUsed=false;this.network();
   this.note(`Cycle ${this.turn}: +${Math.floor(generated)} power / ${demand} demand${weather.storm?' · flare impact':''}.`);
   if(this.integrity<=0){this.integrity=0;this.phase='lost';this.note('Command core lost. Rebuild with shield coverage before the next flare.');}
   else if(this.turn>=36){this.phase='lost';this.note('The departure window closed after cycle 36. Restart to revise your colony plan.');}
   this.forecast=this.predict();return true;
  }
 }
 globalThis.HeliosAccord=HeliosAccord;globalThis.HeliosModules=modules;
})();

