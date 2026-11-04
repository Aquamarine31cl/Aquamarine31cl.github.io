(() => {
 'use strict';
 const root=document.querySelector('[data-arcade-games]');
 if(!root)return;
 const options=[];
 const directions=[[-1,0,'↑'],[0,1,'→'],[1,0,'↓'],[0,-1,'←']];
 const neighbor=(i,d,w,h=w)=>{
  const r=Math.floor(i/w)+directions[d][0],c=i%w+directions[d][1];
  return r>=0&&r<h&&c>=0&&c<w?r*w+c:-1;
 };
 const pick=list=>list[Math.floor(Math.random()*list.length)];
 const completed=new Set();
 const bonusCompleted=new Set();
 const unlockKey='aquamarine.arcade.deep-space.v1';
 let unlocked=false;
 try{unlocked=localStorage.getItem(unlockKey)==='unlocked';}catch{}
 const select=document.createElement('select');
 select.id='arcade-challenge';
 const label=document.createElement('label');
 label.htmlFor=select.id;label.textContent='Choose a challenge';
 const catalog=document.createElement('div');
 catalog.className='star-game challenge-picker';
 catalog.append(label,select);root.append(catalog);
 const panel=document.createElement('section');
 panel.className='star-game';panel.setAttribute('aria-labelledby','challenge-title');
 panel.innerHTML='<p class="cosmic-eyebrow" data-sector></p><h2 id="challenge-title"></h2><p data-rules></p><div data-clues></div><div class="challenge-board" role="group" aria-label="Puzzle board"></div><div class="challenge-actions"></div><p data-result role="status"></p><button type="button" data-reset>Restart Challenge</button><p data-medal role="status" hidden>Event Horizon unlocked. Ten Deep Space missions are now available in the menu.</p>';
 root.append(panel);
 const board=panel.querySelector('.challenge-board'),actions=panel.querySelector('.challenge-actions');
 const result=panel.querySelector('[data-result]'),clues=panel.querySelector('[data-clues]');
 let tiles=[],move=null,gameIndex=0,finished=false;
 const deep=()=>gameIndex>=10;
 const medal=panel.querySelector('[data-medal]');
 function say(text){result.textContent=text;}
 function win(text){
  finished=true;panel.dataset.won='';
  const progress=deep()?bonusCompleted:completed;
  progress.add(gameIndex);
  say(text+' '+progress.size+' / 10 '+(deep()?'Deep Space missions':'challenges')+' completed.');
  if(!unlocked&&completed.size===10){
   unlocked=true;medal.hidden=false;
   try{localStorage.setItem(unlockKey,'unlocked');}catch{}
   populate();
  }
  if(bonusCompleted.size===10){
   medal.hidden=false;
   medal.textContent='Galaxy Cartographer unlocked. All ten Deep Space missions completed!';
  }
 }
 function button(parent,text,handler){
  const control=document.createElement('button');
  control.type='button';control.textContent=text;
  control.addEventListener('click',handler);parent.append(control);
  return control;
 }
 function makeBoard(w,h,click){
  board.style.setProperty('--columns',w);
  tiles=Array.from({length:w*h},(_,i)=>{
   const cell=button(board,'',()=>{if(!finished)click?.(i);});
   if(!click){cell.tabIndex=-1;cell.setAttribute('aria-disabled','true');}
   return cell;
  });
 }
 function tile(i,text,label,state=''){
  const cell=tiles[i];cell.textContent=text;
  cell.setAttribute('aria-label','Cell '+(i+1)+': '+label);
  cell.dataset.state=state;
 }
 function pad(handler){
  move=direction=>{if(!finished)handler(direction);};
  directions.forEach((d,i)=>{
   const control=button(actions,d[2],()=>move(i));
   control.setAttribute('aria-label',['Move up','Move right','Move down','Move left'][i]);
  });
 }
 panel.addEventListener('keydown',event=>{
  if(!move||event.altKey||event.ctrlKey||event.metaKey)return;
  const index=['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].indexOf(event.key);
  if(index<0)return;
  event.preventDefault();move(index);
 });
 function register(title,rules,start){options.push({title,rules,start});}

 register('Cargo Dock','Push both crates onto the two docks. You can push one crate at a time. Use the arrow buttons or arrow keys while focused inside the game.',()=>movement([
  '#######','#     #','# . . #','#  #  #','# $ $ #','#  @  #','#######'
 ],'cargo'));
 register('Cryo Drift','On the ice, each move slides until a wall stops you. Land exactly on the beacon.',()=>movement([
  '#######','# @   #','# #   #','#    ##','#  #  #','#   E #','#######'
 ],'ice'));
 register('Vault Runner','Collect both keys and reach the exit. Avoid the sentry. It advances one square each time you move, so plan your route or wait.',()=>movement([
  '#######','#@ K  #','# ##  #','#  # K#','#   # #','#E    #','#######'
 ],'vault'));
 function movement(rows,mode){
  const map=rows.join(''),w=rows[0].length,h=rows.length;
  let player=map.indexOf('@'),turn=0;
  const budget=deep()?{cargo:9,ice:6,vault:14}[mode]:Infinity;
  const crates=new Set(),keys=new Set();
  const patrol=[10,11,12,19,26,33,40,39,38,37,36,37,38,39,40,33,26,19,12,11];
  [...map].forEach((ch,i)=>{if(ch==='$')crates.add(i);if(ch==='K')keys.add(i);});
  const open=i=>i>=0&&map[i]!=='#';
  const sentry=()=>mode==='vault'?patrol[turn%patrol.length]:-1;
  function paint(){
   [...map].forEach((ch,i)=>{
    if(i===player)tile(i,'●','Explorer','player');
    else if(i===sentry())tile(i,'▲','Sentry','danger');
    else if(crates.has(i))tile(i,'▣',ch==='.'?'Docked crate':'Crate',ch==='.'?'goal':'cargo');
    else if(keys.has(i))tile(i,'⚿','Key','goal');
    else if(ch==='#')tile(i,'','Wall','wall');
    else if(ch==='.'||ch==='E')tile(i,'◎','Destination','goal');
    else tile(i,'','Open space');
   });
  }
  function endTurn(previousSentry){
   turn++;
   keys.delete(player);
   paint();
   if(player===sentry()||player===previousSentry){finished=true;say('The sentry caught you. Restart to try a new route.');}
   else if(mode==='cargo'?[...crates].every(i=>map[i]==='.'):map[player]==='E'&&!keys.size)win('Mission complete!');
   else if(turn>=budget){finished=true;say('Flight budget exhausted. Restart to try another route.');}
   else say((mode==='vault'?'Turn '+turn+' · '+keys.size+' keys remaining.':'Moves: '+turn)+(deep()?' · '+(budget-turn)+' turns left.':''));
  }
  makeBoard(w,h);
  pad(direction=>{
   let next=neighbor(player,direction,w,h);
   if(!open(next))return;
   if(crates.has(next)){
    const beyond=neighbor(next,direction,w,h);
    if(!open(beyond)||crates.has(beyond))return;
    crates.delete(next);crates.add(beyond);
   }
   if(mode==='ice'){
    let ahead=neighbor(next,direction,w,h);
    while(open(ahead)){next=ahead;ahead=neighbor(next,direction,w,h);}
   }
   const previousSentry=sentry();player=next;endTurn(previousSentry);
  });
  if(mode==='vault')button(actions,'Wait',()=>{if(!finished)endTurn(sentry());});
  paint();say(mode==='vault'?'Two keys remain.':'Ready.');
 }

 register('Fusion 128','Slide the board to merge identical numbers. Each tile can merge once per move. Create a 128 tile before the board locks up.',()=>{
  const w=4,values=Array(16).fill(0);
  const goal=deep()?256:128;
  function spawn(){
   const empty=values.flatMap((v,i)=>v?[]:[i]);
   if(empty.length)values[pick(empty)]=Math.random()<.9?2:4;
  }
  function paint(){
   values.forEach((value,i)=>tile(i,value||'',value?String(value):'Empty',value?'cargo':''));
  }
  makeBoard(w,w);
  spawn();spawn();paint();
  pad(direction=>{
   const before=values.join(',');
   for(let line=0;line<w;line++){
    const indices=Array.from({length:w},(_,step)=>{
     if(direction===0)return step*w+line;
     if(direction===1)return line*w+w-1-step;
     if(direction===2)return (w-1-step)*w+line;
     return line*w+step;
    });
    const numbers=indices.map(i=>values[i]).filter(Boolean),merged=[];
    for(let j=0;j<numbers.length;j++){
     if(numbers[j]===numbers[j+1])merged.push(numbers[j++]*2);
     else merged.push(numbers[j]);
    }
    indices.forEach((i,j)=>values[i]=merged[j]||0);
   }
   if(before===values.join(','))return;
   spawn();paint();
   const best=Math.max(...values);
   if(best>=goal)win('Fusion core online.');
   else if(values.every((v,i)=>v&&[1,2].every(d=>values[neighbor(i,d,w)]!==v))){
    finished=true;say('The board is locked. Restart for a new core.');
   }else say('Highest tile: '+best);
  });
  say('Highest tile: '+Math.max(...values));
 });

 register('Asteroid Sweep','Clear all safe cells on the 6×6 board. Numbers count nearby mines. Switch to Flag mode to mark a suspected mine. Your first reveal is safe.',()=>{
  const w=6,mines=new Set(),shown=new Set(),flags=new Set();
  const mineCount=deep()?10:7;
  const safeCount=36-mineCount;
  let flagMode=false;
  const nearby=i=>Array.from({length:36},(_,j)=>j).filter(j=>j!==i&&Math.abs(j%w-i%w)<=1&&Math.abs(Math.floor(j/w)-Math.floor(i/w))<=1);
  const count=i=>nearby(i).filter(j=>mines.has(j)).length;
  const flag=button(actions,'Flag mode: off',()=>{
   flagMode=!flagMode;flag.textContent='Flag mode: '+(flagMode?'on':'off');
   flag.setAttribute('aria-pressed',String(flagMode));
  });
  flag.setAttribute('aria-pressed','false');
  function paint(lost=false){
   tiles.forEach((_,i)=>{
    if(lost&&mines.has(i))tile(i,'✷','Mine','danger');
    else if(shown.has(i))tile(i,count(i)||'',count(i)+' nearby mines','safe');
    else if(flags.has(i))tile(i,'⚑','Flagged','goal');
    else tile(i,'·','Covered');
   });
  }
  makeBoard(w,w,i=>{
   if(shown.has(i))return;
   if(flagMode){
    if(flags.has(i))flags.delete(i);else flags.add(i);
    paint();say(flags.size+' flags placed · '+mineCount+' mines');return;
   }
   if(flags.has(i))return;
   if(!mines.size){
    const pool=tiles.map((_,j)=>j).filter(j=>j!==i&&!nearby(i).includes(j));
    while(mines.size<mineCount)mines.add(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
   }
   if(mines.has(i)){finished=true;paint(true);say('Mine struck. Restart to map a new sector.');return;}
   const queue=[i];
   while(queue.length){
    const current=queue.pop();
    if(shown.has(current)||flags.has(current)||mines.has(current))continue;
    shown.add(current);
    if(!count(current))queue.push(...nearby(current));
   }
   paint();
   if(shown.size===safeCount)win('Sector cleared.');
   else say(shown.size+' / '+safeCount+' safe cells revealed.');
  });
  paint();say('Choose a cell to start.');
 });

 register('Nebula Nonogram','Fill a 5×5 picture. Clues list consecutive filled runs. Runs on the same line must have at least one gap. Each tap cycles blank → filled → crossed.',()=>{
  const pictures=['0111011111101010111010101','0010001110111110111000100','1000101010001000101010001'];
  const target=pick(pictures).split('').map(Number),values=Array(25).fill(0);
  const runs=line=>(line.map(v=>v===1?'1':'0').join('').match(/1+/g)||[]).map(run=>run.length).join(' ')||'0';
  const row=i=>[0,1,2,3,4].map(j=>i*5+j);
  const col=i=>[0,1,2,3,4].map(j=>j*5+i);
  const hints=list=>list.map(line=>runs(line.map(i=>target[i])));
  const rows=hints(Array.from({length:5},(_,i)=>row(i)));
  const cols=hints(Array.from({length:5},(_,i)=>col(i)));
  clues.textContent='Rows, top to bottom: '+rows.join(' / ')+'. Columns, left to right: '+cols.join(' / ')+'.';
  makeBoard(5,5,i=>{
   values[i]=(values[i]+1)%3;
   tile(i,['·','■','×'][values[i]],['Blank','Filled','Crossed'][values[i]],values[i]===1?'goal':'');
   if((!deep()||values.every(Boolean))&&rows.every((hint,j)=>hint===runs(row(j).map(k=>values[k])))&&cols.every((hint,j)=>hint===runs(col(j).map(k=>values[k]))))win('Nebula image recovered.');
  });
  tiles.forEach((_,i)=>tile(i,'·','Blank'));
  say('Use both sets of clues.');
 });

 register('Quantum Pegs','Select a peg and jump over an adjacent peg into an empty cell, horizontally or vertically. The jumped peg disappears. Leave exactly one peg.',()=>{
  const w=5,valid=i=>i>=0&&i<25&&(Math.floor(i/5)===2||i%5===2||[6,8,16,18].includes(i));
  const pegs=new Set([12]);
  function jumps(){
   return [...pegs].flatMap(from=>directions.flatMap((_,d)=>{
    const over=neighbor(from,d,w),to=over<0?-1:neighbor(over,d,w);
    return valid(to)&&pegs.has(over)&&!pegs.has(to)?[[from,over,to]]:[];
   }));
  }
  for(let step=0;step<9;step++){
   const reverse=[...pegs].flatMap(from=>directions.flatMap((_,d)=>{
    const over=neighbor(from,d,w),to=over<0?-1:neighbor(over,d,w);
    return valid(over)&&valid(to)&&!pegs.has(over)&&!pegs.has(to)?[[from,over,to]]:[];
   }));
   if(!reverse.length)break;
   const [from,over,to]=pick(reverse);
   pegs.delete(from);pegs.add(over);pegs.add(to);
  }
  let selected=-1;
  function paint(){
   tiles.forEach((_,i)=>tile(i,pegs.has(i)?'●':valid(i)?'·':'',pegs.has(i)?'Peg':valid(i)?'Empty':'Blocked',
    !valid(i)?'wall':i===selected?'goal':pegs.has(i)?'cargo':''));
  }
  makeBoard(w,w,i=>{
   if(pegs.has(i)){selected=i;paint();return;}
   const jump=jumps().find(([from,,to])=>from===selected&&to===i);
   if(!jump)return;
   pegs.delete(jump[0]);pegs.delete(jump[1]);pegs.add(jump[2]);selected=-1;
   paint();
   if(pegs.size===1&&(!deep()||pegs.has(12)))win('Quantum alignment complete.');
   else if(!jumps().length){finished=true;say('No jumps remain. Restart to try another board.');}
   else say(pegs.size+' pegs remain.');
  });
  paint();say(pegs.size+' pegs remain.');
 });

 register('Knight Survey','Starting in the top-left corner, visit every square once using chess knight moves. Undo lets you backtrack from dead ends.',()=>{
  const w=deep()?6:5,path=[0];
  const knightMove=(a,b)=>Math.abs(Math.floor(a/w)-Math.floor(b/w))*Math.abs(a%w-b%w)===2;
  const legal=(a,b)=>{
   const dr=Math.abs(Math.floor(a/w)-Math.floor(b/w)),dc=Math.abs(a%w-b%w);
   return dr*dc===2&&!path.includes(b);
  };
  function paint(){
   const current=path[path.length-1];
   tiles.forEach((_,i)=>{
    const step=path.indexOf(i)+1;
    tile(i,step||'·',step?'Visited, step '+step:legal(current,i)?'Available jump':'Unvisited',
     i===current?'player':step?'safe':legal(current,i)?'goal':'');
   });
   if(path.length===w*w&&(!deep()||knightMove(current,0)))win('Survey completed.');
   else if(path.length===w*w)say('The route does not return to the start. Undo to revise it.');
   else say(path.length+' / '+w*w+' squares surveyed.');
  }
  makeBoard(w,w,i=>{if(legal(path[path.length-1],i)){path.push(i);paint();}});
  button(actions,'Undo',()=>{if(path.length>1&&!finished){path.pop();paint();}});
  paint();
 });

 register('Queen Constellation','Place eight queens. No two can share a row, column, or diagonal. Tap a placed queen to remove it.',()=>{
  const w=8,queens=new Set();
  if(deep())queens.add(0);
  const conflict=(a,b)=>{
   const dr=Math.abs(Math.floor(a/w)-Math.floor(b/w)),dc=Math.abs(a%w-b%w);
   return !dr||!dc||dr===dc;
  };
  function paint(){
   tiles.forEach((_,i)=>{
    const occupied=queens.has(i),safe=![...queens].some(q=>conflict(q,i));
    tile(i,occupied?'♛':safe?'·':'',occupied?'Queen':safe?'Safe':'Attacked',occupied?'goal':safe?'':'safe');
   });
  }
  makeBoard(w,w,i=>{
   if(deep()&&i===0){say('The beacon queen is fixed.');return;}
   if(queens.has(i))queens.delete(i);
   else if([...queens].some(q=>conflict(q,i))){say('That square is already under attack.');return;}
   else queens.add(i);
   paint();
   if(queens.size===8)win('Eight queens in harmony.');
   else say(queens.size+' / 8 queens placed.');
  });
  paint();say(deep()?'The first queen is anchored.':'Place your first queen.');
 });

 register('Relay Circuit','Rotate the tiles to connect the central hub to every cell. The box-drawing lines show cable ports. A working circuit has no dangling ports.',()=>{
  const w=deep()?6:5,hub=Math.floor(w/2)*w+Math.floor(w/2);
  const ports=Array(w*w).fill(0),reached=new Set([hub]),frontier=[hub];
  const glyph=['·','╵','╶','└','╷','│','┌','├','╴','┘','─','┴','┐','┤','┬','┼'];
  const rotate=value=>((value<<1)&15)|(value>>3);
  while(frontier.length){
   const from=pick(frontier);
   const choices=directions.flatMap((_,d)=>{
    const to=neighbor(from,d,w);
    return to>=0&&!reached.has(to)?[[to,d]]:[];
   });
   if(!choices.length){frontier.splice(frontier.indexOf(from),1);continue;}
   const [to,d]=pick(choices);
   ports[from]|=1<<d;ports[to]|=1<<((d+2)%4);reached.add(to);frontier.push(to);
  }
  for(let i=0;i<ports.length;i++)for(let n=Math.floor(Math.random()*4);n>0;n--)ports[i]=rotate(ports[i]);
  // Force a dangling north port in the top-left corner so the board starts unsolved.
  while(!(ports[0]&1))ports[0]=rotate(ports[0]);
  function paint(check=true){
   const powered=new Set([hub]),queue=[hub];
   let dangling=false;
   while(queue.length){
    const from=queue.pop();
    directions.forEach((_,d)=>{
     if(!(ports[from]&(1<<d)))return;
     const to=neighbor(from,d,w);
     if(to<0||!(ports[to]&(1<<((d+2)%4)))){dangling=true;return;}
     if(!powered.has(to)){powered.add(to);queue.push(to);}
    });
   }
   const names=['north','east','south','west'];
   ports.forEach((mask,i)=>tile(i,glyph[mask],(i===hub?'Hub, ':'')+names.filter((_,d)=>mask&(1<<d)).join(', '),i===hub?'player':powered.has(i)?'goal':''));
   if(check&&powered.size===w*w&&!dangling)win('Relay network online.');
   else say(powered.size+' / '+w*w+' cells powered.');
  }
  makeBoard(w,w,i=>{ports[i]=rotate(ports[i]);paint();});
  paint(false);
 });

 const sectors=['Orion Freight Lane','Europa Icefield','Perseus Outpost','Cygnus Forge','Kuiper Belt','Carina Nebula','Pulsar Laboratory','Andromeda Survey','Cassiopeia Array','Milky Way Relay'];
 const bonus=[
  ['Orion Emergency Dock','Deliver both crates in at most nine moves.'],
  ['Europa Precision Drift','Reach the beacon in at most six slides.'],
  ['Perseus Blackout','Collect both keys and escape in at most fourteen turns, including waits.'],
  ['Cygnus Supercore','Merge a 256 tile before the board locks.'],
  ['Kuiper Minefield','Reveal all safe cells with ten mines on the board. The first reveal is safe.'],
  ['Carina Dark Matter Map','Fill the runs from the clues and mark every empty cell with a cross.'],
  ['Pulsar Singularity','Leave exactly one peg on the center square.'],
  ['Andromeda Closed Survey','Visit all 36 squares and end a knight move away from the start. Undo is available.'],
  ['Cassiopeia Fixed Beacon','Place eight non-attacking queens. The top-left queen cannot move.'],
  ['Intergalactic Backbone','Power every tile on a 6×6 relay network without dangling ports.']
 ];
 bonus.forEach(([title,rules],i)=>register(title,rules,options[i].start));
 function populate(){
  const selected=select.value||'0';
  select.replaceChildren();
  const groups=[document.createElement('optgroup'),document.createElement('optgroup')];
  groups[0].label='Milky Way campaign';groups[1].label='Deep Space archive';
  options.slice(0,unlocked?20:10).forEach(({title},i)=>groups[i<10?0:1].append(new Option(title,i)));
  select.append(groups[0]);if(unlocked)select.append(groups[1]);
  select.value=selected;
 }
 function open(){
  gameIndex=Number(select.value);const game=options[gameIndex];
  finished=false;move=null;panel.removeAttribute('data-won');
  board.replaceChildren();actions.replaceChildren();clues.textContent='';
  panel.querySelector('h2').textContent=game.title;
  panel.querySelector('[data-sector]').textContent=(deep()?'DEEP SPACE / ':'MISSION / ')+sectors[gameIndex%10];
  panel.dataset.sector=String(gameIndex%10);
  panel.querySelector('[data-rules]').textContent=game.rules;
  game.start();
 }
 populate();
 select.addEventListener('change',open);
 panel.querySelector('[data-reset]').addEventListener('click',open);
 open();
})();
