(() => {
 'use strict';
 const root=document.querySelector('[data-advanced-arcade]');
 if(!root)return;
 function section(title,rules){
  const panel=document.createElement('section');
  panel.className='star-game';
  panel.innerHTML='<h2>'+title+'</h2><p>'+rules+'</p><p data-stats></p><div data-field></div><div class="challenge-actions"></div><p role="status"></p>';
  root.append(panel);
  return {
   field:panel.querySelector('[data-field]'),
   controls:panel.querySelector('.challenge-actions'),
   stats:text=>panel.querySelector('[data-stats]').textContent=text,
   say:text=>panel.querySelector('[role="status"]').textContent=text
  };
 }
 function button(parent,label,action){
  const element=document.createElement('button');
  element.type='button';element.textContent=label;element.addEventListener('click',action);
  parent.append(element);return element;
 }

 const fleet=section('Perseus Fleet Command','Hold C3 and D5 through two consecutive enemy responses by round 7. Each ship has two actions per round. Select a ship, then select an adjacent empty square to move or an enemy within weapon range to attack. Asteroids block movement and a nebula reduces incoming damage.');
 const board=fleet.field;board.className='challenge-board';board.style.setProperty('--columns',5);
 const rocks=new Set([7,17]),cover=new Set([6,8,16,18]),relay=12,uplink=23;
 const distance=(a,b)=>Math.abs(a%5-b%5)+Math.abs(Math.floor(a/5)-Math.floor(b/5));
 let ships,round,selected,finished,held;
 const at=i=>ships.find(ship=>ship.hp>0&&ship.pos===i);
 const cells=Array.from({length:25},(_,i)=>button(board,'',()=>play(i)));
 const end=button(fleet.controls,'End Fleet Turn',enemyTurn);
 const guard=button(fleet.controls,'Brace (1 action)',()=>{
  selected.ap--;selected.braced=true;paintFleet();
  fleet.say(selected.name+' will absorb up to 2 damage from the next hit.');
 });
 const repair=button(fleet.controls,'Repair Fleet (1 action)',()=>{
  const target=repairTarget();
  selected.ap--;kits--;target.hp=Math.min(target.maxHull,target.hp+3);
  paintFleet();fleet.say(target.name+' repaired. '+kits+' repair kits remain.');
 });
 button(fleet.controls,'Restart Battle',resetFleet);
 let kits;
 function repairTarget(){
  if(selected?.symbol!=='M'||!selected.ap||!kits)return;
  return ships.filter(s=>!s.side&&s.hp>0&&s.hp<s.maxHull&&distance(s.pos,selected.pos)<=1)
   .sort((a,b)=>(b.maxHull-b.hp)-(a.maxHull-a.hp))[0];
 }
 function resetFleet(){
  ships=[
   {name:'Vanguard',symbol:'V',side:0,pos:10,hp:8,range:1,damage:3,ap:2},
   {name:'Corsair',symbol:'C',side:0,pos:20,hp:5,range:2,damage:2,ap:2},
   {name:'Mender',symbol:'M',side:0,pos:5,hp:5,range:1,damage:1,ap:2},
   {name:'Raider',symbol:'R',side:1,pos:14,hp:5,range:1,damage:2},
   {name:'Sentinel',symbol:'S',side:1,pos:4,hp:4,range:2,damage:2}
  ];
  ships.forEach(ship=>ship.maxHull=ship.hp);
  round=1;selected=null;finished=false;held=0;kits=2;
  paintFleet();fleet.say('Vanguard hits hard, Corsair attacks at range, and Mender repairs the most damaged adjacent ally or itself. Enemy reinforcements are due in round 3.');
 }
 function paintFleet(){
  cells.forEach((cell,i)=>{
   const ship=at(i);
   const terrain=rocks.has(i)?'Asteroid':cover.has(i)?'Nebula':i===relay?'Relay':i===uplink?'Uplink':'Open space';
   cell.textContent=ship?ship.symbol:rocks.has(i)?'▪':cover.has(i)?'≈':i===relay?'◎':i===uplink?'◇':'·';
   cell.dataset.state=ship?(ship.side?'danger':ship===selected?'goal':'player'):rocks.has(i)?'wall':(i===relay||i===uplink)?'goal':cover.has(i)?'safe':'';
   cell.setAttribute('aria-label',String.fromCharCode(65+i%5)+(1+Math.floor(i/5))+', '+terrain+(ship?', '+ship.name+' '+ship.hp+' hull':''));
   cell.setAttribute('aria-pressed',String(Boolean(ship&&ship===selected)));
   cell.disabled=finished;
  });
  const details=ships.filter(s=>!s.side&&s.hp>0).map(s=>s.name+': '+s.hp+' hull, '+s.ap+' actions');
  fleet.stats('Round '+round+' / 7 · Signal lock '+held+' / 2 · Repair kits '+kits+' · '+details.join(' · '));
  end.disabled=finished;
  guard.disabled=finished||!selected?.ap||selected.braced;
  repair.disabled=finished||!repairTarget();
 }
 function strike(attacker,target){
  const damage=Math.max(1,attacker.damage-Number(cover.has(target.pos)));
  target.hp-=Math.max(0,damage-(target.braced?2:0));target.braced=false;
 }
 function play(i){
  if(finished)return;
  const target=at(i);
  if(target&&!target.side){selected=target;paintFleet();fleet.say(target.name+' selected. Weapon range '+target.range+'.');return;}
  if(!selected||!selected.ap){fleet.say('Select a ship with actions remaining.');return;}
  const gap=distance(selected.pos,i);
  if(target&&gap<=selected.range){strike(selected,target);fleet.say(target.name+(target.hp<=0?' destroyed.':' hit.'));}
  else if(!target&&gap===1&&!rocks.has(i)){selected.pos=i;fleet.say(selected.name+' moved.');}
  else{fleet.say('That target is out of range or blocked.');return;}
  selected.ap--;paintFleet();
 }
 function enemyTurn(){
  if(finished)return;
  for(const foe of ships.filter(s=>s.side&&s.hp>0)){
   const targets=ships.filter(s=>!s.side&&s.hp>0).sort((a,b)=>distance(foe.pos,a.pos)-distance(foe.pos,b.pos)||a.hp-b.hp);
   const victim=targets[0];
   if(!victim)break;
   if(distance(foe.pos,victim.pos)<=foe.range)strike(foe,victim);
   else{
    const next=cells.map((_,i)=>i).filter(i=>distance(i,foe.pos)===1&&!at(i)&&!rocks.has(i)).sort((a,b)=>distance(a,victim.pos)-distance(b,victim.pos))[0];
    if(next!==undefined)foe.pos=next;
   }
  }
  const holder=at(relay);
  const link=at(uplink);
  held=holder?.side===0&&link?.side===0?held+1:0;
  if(held===2){finished=true;fleet.say('Victory. Both Perseus stations held through two enemy responses.');}
  else if(round===7||!ships.some(s=>!s.side&&s.hp>0)){finished=true;fleet.say('Defeat. The relay remained unsecured.');}
  else{
   round++;ships.forEach(s=>{if(!s.side){s.ap=2;s.braced=false;}});
   if(round===3){
    const spawn=[24,19,9,4].find(i=>!at(i));
    if(spawn!==undefined)ships.push({name:'Interceptor',symbol:'I',side:1,pos:spawn,hp:3,range:1,damage:3});
   }
   fleet.say(round===3?'An interceptor has arrived from the eastern edge.':'Enemy response complete. Plan your next actions.');
  }
  selected=null;paintFleet();
 }
 resetFleet();

 const supply=section('Helios Supply Directorate','Keep food and energy flowing for six cycles, then finish with one unit of each in reserve. Express arrives this cycle. Bulk arrives next cycle, and storms close the bulk lane in cycles 2 and 5. The two resources share the same cargo capacity and budget.');
 const demand=[[2,1],[3,2],[2,2],[4,2],[2,2],[3,2]];
 const total=pair=>pair[0]+pair[1];
 const describe=pair=>pair[0]+' food / '+pair[1]+' energy';
 let cycle,stock,credits,incoming,express,bulk,closed,orders;
 const orderButtons=[];
 for(const [mode,cost] of [['express',3],['bulk',1]]){
  for(const [resource,name] of ['food','energy'].entries()){
   const control=button(supply.controls,mode+' '+name+' +1 ('+cost+' credits)',()=>{
    (mode==='bulk'?bulk:express)[resource]++;
    credits-=cost;orders.push({mode,resource,cost});
    paintSupply();supply.say('Cargo booked. Review the projected balance.');
   });
   orderButtons.push({mode,cost,control});
  }
 }
 const undo=button(supply.controls,'Undo Last Order',()=>{
  const {mode,resource,cost}=orders.pop();
  (mode==='bulk'?bulk:express)[resource]--;credits+=cost;
  paintSupply();supply.say('Last order cancelled.');
 });
 const settle=button(supply.controls,'Run Supply Cycle',advance);
 button(supply.controls,'Restart Contract',resetSupply);
 function resetSupply(){
  cycle=0;stock=[3,2];credits=34;incoming=[0,0];express=[0,0];bulk=[0,0];closed=false;orders=[];
  paintSupply();supply.say('Plan shipments against the six-cycle forecast. Income is two credits per cycle.');
 }
 function projection(){return stock.map((units,i)=>units+incoming[i]+express[i]-demand[cycle][i]);}
 function paintSupply(){
  const storm=cycle===1||cycle===4;
  supply.stats('Cycle '+Math.min(cycle+1,6)+' / 6 · Stock '+describe(stock)+' · Credits '+credits);
  supply.field.textContent=closed?'Contract ended.':'Demand (food / energy): '+demand.map(pair=>pair.join('/')).join(', ')+
   '. Arrival: '+describe(incoming)+' bulk and '+describe(express)+' express. Next cycle: '+describe(bulk)+
   '. Projected closing stock: '+describe(projection())+'. '+(storm?'Bulk lane closed.':'Bulk capacity: 5.')+' Express capacity: 5.';
  for(const {mode,cost,control} of orderButtons){
   control.disabled=closed||credits<cost||(mode==='bulk'?(storm||cycle===5||total(bulk)===5):total(express)===5);
  }
  settle.disabled=closed;undo.disabled=closed||!orders.length;
 }
 function advance(){
  const balance=projection();
  if(balance.some(value=>value<0)){
   closed=true;supply.say('Contract failed. The colony ran out of '+(balance[0]<0?'food':'energy')+'.');paintSupply();return;
  }
  stock=balance;credits+=2;cycle++;
  incoming=bulk;express=[0,0];bulk=[0,0];orders=[];
  if(cycle===6){
   closed=true;
   supply.say(stock.every(value=>value>=1)?'Contract fulfilled. Both reserves secured, with '+credits+' credits remaining.':'Contract failed. Final reserves fell below one unit of each resource.');
  }else supply.say('Cycle complete. Review stock and upcoming deliveries.');
  paintSupply();
 }
 resetSupply();

 const grid=section('Cygnus Grid Operator','Power the station through six shifts and finish with 2 battery units. Reactor output can change by at most 2 per shift. Renewables are free. Excess charges the battery, while deficits drain it. The battery can move at most 3 units per shift and stores at most 6. Unserved demand ends the run.');
 const forecast=[
  {load:5,wind:4,limit:6},{load:8,wind:2,limit:6},{load:10,wind:1,limit:6},
  {load:6,wind:5,limit:4},{load:9,wind:2,limit:6},{load:7,wind:3,limit:6}
 ];
 let shift,output,setting,battery,budget,blackout;
 const down=button(grid.controls,'Reduce Output',()=>{setting--;paintGrid();});
 const up=button(grid.controls,'Raise Output',()=>{setting++;paintGrid();});
 const dispatch=button(grid.controls,'Dispatch Shift',dispatchShift);
 button(grid.controls,'Restart Grid',resetGrid);
 function resetGrid(){
  shift=0;output=2;setting=2;battery=4;budget=26;blackout=false;
  grid.say('Plan reactor output ahead of peak demand and the line outage in shift 4.');
  paintGrid();
 }
 function paintGrid(){
  grid.stats('Shift '+Math.min(shift+1,6)+' / 6 · Battery '+battery+' / 6 · Budget '+budget+' · Reactor '+setting);
  const row=forecast[shift];
  if(row){
   const delivered=Math.min(setting,row.limit);
   const balance=row.wind+delivered-row.load;
   grid.field.textContent='Forecast (load / renewables / reactor line limit): '+forecast.map(item=>[item.load,item.wind,item.limit].join('/')).join(', ')+
    '. Current shift delivers '+delivered+' reactor units. Battery balance: '+(balance>=0?'+':'')+balance+
    ' before limits. Cost: '+setting+' credits, including any curtailed output.';
  }
  down.disabled=blackout||setting<=Math.max(0,output-2);
  up.disabled=blackout||setting>=Math.min(6,output+2);
  dispatch.disabled=blackout;
 }
 function dispatchShift(){
  const row=forecast[shift];
  const balance=row.wind+Math.min(setting,row.limit)-row.load;
  if(setting>budget||-balance>Math.min(3,battery)){
   blackout=true;
   grid.say(setting>budget?'Grid failed. Fuel budget exhausted.':'Grid failed. The battery cannot cover this deficit.');
   paintGrid();return;
  }
  budget-=setting;battery=Math.min(6,battery+Math.min(3,balance));output=setting;shift++;
  if(shift===6){
   blackout=true;
   grid.say(battery>=2?'Grid stabilized. All six shifts served with '+battery+' battery units in reserve.':'Grid failed. The final reserve fell below 2 units.');
  }else grid.say('Shift served. Review the next forecast before dispatching.');
  paintGrid();
 }
 resetGrid();

 const orbit=section('Asterion Gravity Transfer','Scan the survey beacon, then dock at the station at zero velocity. Each turn, coast or burn one fuel unit to change velocity. The gravity well adds one unit of pull toward its axis when you start on a marked tile. Speed is limited to two cells per axis. Check the flight preview for collisions.');
 const orbitBoard=orbit.field;
 orbitBoard.className='challenge-board';orbitBoard.style.setProperty('--columns',7);
 orbitBoard.setAttribute('aria-hidden','true');
 const well=[3,3],station=[5,1],beacon=[5,5];
 const debris=new Set(['3,3','2,2','4,4','3,5']);
 const key=(x,y)=>x+','+y;
 const same=(x,y,point)=>x===point[0]&&y===point[1];
 const inGravity=(x,y)=>Math.abs(well[0]-x)+Math.abs(well[1]-y)===2;
 const maneuvers=[[0,0,'Coast'],[0,-1,'Burn North'],[1,0,'Burn East'],[0,1,'Burn South'],[-1,0,'Burn West']];
 let craft,chosen;
 const squares=Array.from({length:49},()=>{
  const cell=document.createElement('span');orbitBoard.append(cell);return cell;
 });
 const burns=maneuvers.map(([, ,name],i)=>button(orbit.controls,name,()=>{chosen=i;paintOrbit();}));
 const flight=button(orbit.controls,'Execute Maneuver',fly);
 button(orbit.controls,'Restart Flight',resetOrbit);
 function resetOrbit(){
  craft={x:1,y:5,vx:0,vy:0,fuel:10,turn:0,scanned:false,done:false};chosen=0;
  orbit.say('Survey the beacon at F6 before docking at F2.');paintOrbit();
 }
 function projected(){
  const [dx,dy]=maneuvers[chosen];
  const {x,y}=craft;
  let vx=craft.vx+dx,vy=craft.vy+dy;
  if(inGravity(x,y)){
   if(Math.abs(well[0]-x)>=Math.abs(well[1]-y))vx+=Math.sign(well[0]-x);
   else vy+=Math.sign(well[1]-y);
  }
  vx=Math.max(-2,Math.min(2,vx));vy=Math.max(-2,Math.min(2,vy));
  const steps=Math.max(1,Math.abs(vx),Math.abs(vy));
  let danger=false;
  for(let i=1;i<=steps;i++){
   const nx=x+Math.round(vx*i/steps),ny=y+Math.round(vy*i/steps);
   if(nx<0||nx>6||ny<0||ny>6||debris.has(key(nx,ny)))danger=true;
  }
  return {x:x+vx,y:y+vy,vx,vy,danger};
 }
 function paintOrbit(){
  const next=projected();
  squares.forEach((cell,i)=>{
   const x=i%7,y=Math.floor(i/7);
   const type=same(x,y,[craft.x,craft.y])?'ship':same(x,y,station)?'station':same(x,y,beacon)?'beacon':
    debris.has(key(x,y))?'hazard':inGravity(x,y)?'gravity':'empty';
   cell.textContent={ship:'▲',station:'◎',beacon:'✦',hazard:'▪',gravity:'≈',empty:'·'}[type];
   cell.dataset.orbitTile=type;
   cell.toggleAttribute('data-flight-preview',!craft.done&&same(x,y,[next.x,next.y]));
  });
  burns.forEach((control,i)=>{control.disabled=craft.done||(i>0&&!craft.fuel);control.setAttribute('aria-pressed',String(chosen===i));});
  flight.disabled=craft.done;
  const location=(x,y)=>String.fromCharCode(65+x)+(y+1);
  orbit.stats('Turn '+craft.turn+' / 16 · '+location(craft.x,craft.y)+' · Velocity '+craft.vx+', '+craft.vy+
   ' · Fuel '+craft.fuel+' · Survey '+(craft.scanned?'complete':'pending')+
   (craft.done?'':' · Forecast: '+(next.danger?'unsafe':location(next.x,next.y)+' at '+next.vx+', '+next.vy)));
 }
 function fly(){
  const next=projected();craft.turn++;
  if(chosen)craft.fuel--;
  if(next.danger){craft.done=true;orbit.say('Flight failed. The trajectory hit debris or left the chart.');paintOrbit();return;}
  Object.assign(craft,next);chosen=0;
  craft.scanned||=same(craft.x,craft.y,beacon);
  if(craft.scanned&&same(craft.x,craft.y,station)&&!craft.vx&&!craft.vy){
   craft.done=true;orbit.say('Docking complete. Survey data delivered with '+craft.fuel+' fuel remaining.');
  }else if(craft.turn===16){craft.done=true;orbit.say('Flight failed. The docking window has closed.');}
  else orbit.say(craft.scanned?'Survey complete. Approach F2 and cancel both velocity components.':'Beacon scan pending.');
  paintOrbit();
 }
 resetOrbit();

 const lab=section('Kepler Research Board','Submit the safety report by week 4 and finish the flight prototype by week 7. Projects consume credits each week they run. Prerequisites must be complete before the next project can start. You have two staff slots except in week 3, when only one team is available.');
 const projects=[
  {name:'Materials',weeks:2,cost:2,requires:[]},
  {name:'Simulation',weeks:2,cost:1,requires:[]},
  {name:'Engine',weeks:2,cost:3,requires:[0]},
  {name:'Safety Report',weeks:2,cost:2,requires:[1]},
  {name:'Flight Prototype',weeks:2,cost:3,requires:[2,3]}
 ];
 let week,creditsLeft,work,assigned,labDone;
 const jobs=projects.map((project,index)=>button(lab.field,project.name,()=>{
  if(assigned.has(index))assigned.delete(index);else assigned.add(index);
  paintLab();
 }));
 lab.field.className='challenge-actions';
 const runLab=button(lab.controls,'Run Research Week',()=>{
  const cost=[...assigned].reduce((sum,i)=>sum+projects[i].cost,0);
  creditsLeft-=cost;
  for(const i of assigned)work[i]++;
  assigned.clear();
  if(week===4&&work[3]<projects[3].weeks){labDone=true;lab.say('Program failed. The safety submission deadline was missed.');}
  else if(work[4]===projects[4].weeks){labDone=true;lab.say('Program complete. Flight prototype certified with '+creditsLeft+' credits remaining.');}
  else if(week===7){labDone=true;lab.say('Program failed. The launch window closed before certification.');}
  else{week++;lab.say('Week complete. Review the newly available work.');}
  paintLab();
 });
 button(lab.controls,'Restart Research',resetLab);
 function resetLab(){
  week=1;creditsLeft=22;work=projects.map(()=>0);assigned=new Set();labDone=false;
  lab.say('Select up to two projects to staff. A late start can make the prototype deadline impossible.');
  paintLab();
 }
 function paintLab(){
  const cost=[...assigned].reduce((sum,i)=>sum+projects[i].cost,0);
  const capacity=week===3?1:2;
  lab.stats('Week '+week+' / 7 · Credits '+creditsLeft+' · Staff '+assigned.size+' / '+capacity+' · Committed cost '+cost);
  projects.forEach((project,i)=>{
   const waiting=project.requires.filter(j=>work[j]<projects[j].weeks);
   jobs[i].textContent=project.name+' '+work[i]+'/'+project.weeks+' · '+project.cost+' credits'+
    (waiting.length?' · needs '+waiting.map(j=>projects[j].name).join(' and '):'');
   jobs[i].setAttribute('aria-pressed',String(assigned.has(i)));
   jobs[i].disabled=labDone||work[i]===project.weeks||waiting.length>0||
    (!assigned.has(i)&&(assigned.size===capacity||cost+project.cost>creditsLeft));
  });
  runLab.disabled=labDone;
 }
 resetLab();

 const stationControl=section('Vesper Station Emergency','Stabilize a station after a micrometeor strike. You have two crew actions per shift. Unsealed leaks raise pressure loss, an active fire increases heat and spreads, and low power prevents pump operation. Stabilize all three systems before the sixth shift ends.');
 let emergency;
 const procedures=[
  ['Seal Breach','breach',s=>s.leaks>0,s=>s.leaks--],
  ['Fight Fire','fire',s=>s.fire>0,s=>s.fire--],
  ['Restore Power','power',s=>s.power<4,s=>s.power++],
  ['Run Coolant Pump','heat',s=>s.power>=3&&s.heat>0,s=>s.heat=Math.max(0,s.heat-3)],
  ['Repressurize','pressure',s=>!s.leaks&&s.power>=2&&s.pressure<8,s=>s.pressure=Math.min(8,s.pressure+3)]
 ];
 const proceduresUI=procedures.map(([label,,allowed,effect])=>button(stationControl.controls,label,()=>{
  effect(emergency);emergency.actions--;
  stationControl.say(label+' complete.');paintEmergency();
 }));
 const resolve=button(stationControl.controls,'End Emergency Shift',endEmergency);
 button(stationControl.controls,'Restart Emergency',resetEmergency);
 function resetEmergency(){
  emergency={shift:1,actions:2,leaks:2,fire:2,power:2,pressure:8,heat:3,done:false};
  stationControl.say('Decide which failures to contain before the first shift ends.');
  paintEmergency();
 }
 function paintEmergency(){
  const s=emergency;
  stationControl.stats('Shift '+s.shift+' / 6 · Actions '+s.actions+' · Pressure '+s.pressure+' / 8 · Heat '+s.heat+' / 10');
  stationControl.field.textContent='Breaches '+s.leaks+' · Fire '+s.fire+' · Power '+s.power+' / 4. End-of-shift losses: '+s.leaks+' pressure and +'+s.fire+' heat. At heat 7 or above, a remaining fire spreads by one.';
  proceduresUI.forEach((control,i)=>control.disabled=s.done||!s.actions||!procedures[i][2](s));
  resolve.disabled=s.done;
 }
 function endEmergency(){
  const s=emergency;
  s.pressure-=s.leaks;s.heat+=s.fire;
  if(s.heat>=7&&s.fire)s.fire++;
  if(s.pressure<=0||s.heat>=10){
   s.done=true;stationControl.say('Station lost. '+(s.pressure<=0?'Pressure collapsed.':'The reactor overheated.'));
  }else if(!s.leaks&&!s.fire&&s.power>=3&&s.pressure>=6&&s.heat<=3){
   s.done=true;stationControl.say('Station stabilized. Crew, pressure, and reactor are secure.');
  }else if(s.shift===6){
   s.done=true;stationControl.say('Station lost. The evacuation window closed before stabilization.');
  }else{
   s.shift++;s.actions=2;stationControl.say('Systems updated. Contain the next cascade.');
  }
  paintEmergency();
 }
 resetEmergency();
})();
