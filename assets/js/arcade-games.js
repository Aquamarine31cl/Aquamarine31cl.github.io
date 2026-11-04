(() => {
 'use strict';
 const arcade=document.querySelector('[data-arcade-games]');
 if(!arcade)return;
 const wins=new Set();
 const reward=document.createElement('p');
 reward.className='star-game';
 reward.hidden=true;
 reward.setAttribute('role','status');
 function win(id){
  wins.add(id);
  if(wins.size===4){
   reward.hidden=false;
   reward.dataset.won='';
   reward.textContent='Galaxy Key discovered. You solved all four arcade challenges!';
  }
 }
 function game(id,title,rules,controls){
  const panel=document.createElement('section');
  panel.className='star-game';
  panel.setAttribute('aria-labelledby',id+'-title');
  panel.innerHTML='<h2 id="'+id+'-title">'+title+'</h2><p>'+rules+'</p>'+controls+
   '<p data-result role="status"></p><button type="button" data-restart>New Round</button>';
  arcade.append(panel);
  return panel;
 }
 function message(panel,text){
  panel.querySelector('[data-result]').textContent=text;
 }
 function board(panel){
  const grid=panel.querySelector('.star-game-board');
  return Array.from({length:9},(_,index)=>{
   const cell=document.createElement('button');
   cell.type='button';
   cell.dataset.cell=index;
   grid.append(cell);
   return cell;
  });
 }
 const grid='<div class="star-game-board" role="group" aria-label="Game board"></div>';

 const lanterns=game('lanterns','Nebula Lights','Switch off all nine lights. Each press flips that light and its neighbors above, below, left and right.',grid);
 const lights=board(lanterns);
 let lit=[],moves=0;
 function flip(index){
  const row=Math.floor(index/3),column=index%3;
  for(let i=0;i<9;i++){
   if(Math.abs(Math.floor(i/3)-row)+Math.abs(i%3-column)<=1)lit[i]=!lit[i];
  }
 }
 function paintLights(){
  const done=lit.every(value=>!value);
  lights.forEach((cell,i)=>{
   cell.textContent=lit[i]?'✦':'○';
   cell.setAttribute('aria-label','Light '+(i+1)+(lit[i]?', on':', off'));
   cell.setAttribute('aria-pressed',String(lit[i]));
   cell.disabled=done;
  });
  message(lanterns,done?'Nebula cleared in '+moves+' moves.':'Moves: '+moves);
  if(done)win('lanterns');
 }
 function resetLights(){
  lit=Array(9).fill(false);moves=0;
  const indices=[0,1,2,3,4,5,6,7,8];
  for(let i=0;i<3;i++)flip(indices.splice(Math.floor(Math.random()*indices.length),1)[0]);
  if(lit.every(value=>!value))flip(4);
  paintLights();
 }
 lights.forEach((cell,i)=>cell.addEventListener('click',()=>{flip(i);moves++;paintLights();}));
 lanterns.querySelector('[data-restart]').addEventListener('click',resetLights);
 resetLights();

 const duel=game('duel','Orbit Three','Play X against the station computer. Make a line of three to win.',grid);
 const cells=board(duel);
 const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
 let marks=[],finished=false;
 const hasLine=mark=>lines.some(line=>line.every(i=>marks[i]===mark));
 function paintDuel(text){
  cells.forEach((cell,i)=>{
   cell.textContent=marks[i]||'·';
   cell.setAttribute('aria-label','Square '+(i+1)+', '+(marks[i]||'empty'));
   cell.setAttribute('aria-disabled',String(finished||Boolean(marks[i])));
  });
  message(duel,text);
 }
 function endDuel(mark){
  if(hasLine(mark)){
   finished=true;
   paintDuel(mark==='X'?'You won the orbit duel.':'The station won this round.');
   if(mark==='X')win('duel');
   return true;
  }
  if(marks.every(Boolean)){
   finished=true;
   paintDuel('A draw. Try another round.');
  }
  return finished;
 }
 cells.forEach((cell,i)=>cell.addEventListener('click',()=>{
  if(finished||marks[i])return;
  marks[i]='X';
  if(endDuel('X'))return;
  const free=marks.flatMap((mark,index)=>mark?[]:[index]);
  const winning=free.find(index=>{
   marks[index]='O';
   const winsNow=hasLine('O');
   marks[index]='';
   return winsNow;
  });
  marks[winning??free[Math.floor(Math.random()*free.length)]]='O';
  if(!endDuel('O'))paintDuel('Your turn.');
 }));
 function resetDuel(){marks=Array(9).fill('');finished=false;paintDuel('Your turn.');}
 duel.querySelector('[data-restart]').addEventListener('click',resetDuel);
 resetDuel();

 const signal=game('signal','Signal Finder','Find a hidden frequency from 1 to 50 in seven guesses. The station will tell you to tune higher or lower.',
  '<form><label for="arcade-frequency">Frequency</label><input id="arcade-frequency" type="number" min="1" max="50" step="1" required><button>Guess</button></form>');
 const form=signal.querySelector('form');
 const input=form.querySelector('input');
 let target=0,guesses=0;
 function resetSignal(){
  target=1+Math.floor(Math.random()*50);guesses=0;form.hidden=false;form.reset();
  message(signal,'Seven guesses remaining.');
 }
 form.addEventListener('submit',event=>{
  event.preventDefault();
  const value=input.valueAsNumber;
  guesses++;
  if(value===target||guesses===7){
   form.hidden=true;
   message(signal,value===target?'Signal found at '+target+'!':'The hidden frequency was '+target+'.');
   if(value===target)win('signal');
   signal.querySelector('[data-restart]').focus();
   return;
  }
  message(signal,(value<target?'Tune higher. ':'Tune lower. ')+(7-guesses)+' guesses remaining.');
  input.select();
 });
 signal.querySelector('[data-restart]').addEventListener('click',resetSignal);
 resetSignal();

 const cargo=game('cargo','Comet Cargo','Take one, two or three crystals. The station takes a turn after you. Whoever takes the last crystal wins.',
  '<div class="star-game-grid"><button type="button" data-take="1">Take 1</button><button type="button" data-take="2">Take 2</button><button type="button" data-take="3">Take 3</button></div>');
 const choices=Array.from(cargo.querySelectorAll('[data-take]'));
 let remaining=15;
 function paintCargo(text){
  choices.forEach(button=>button.disabled=Number(button.dataset.take)>remaining);
  message(cargo,text);
 }
 choices.forEach(button=>button.addEventListener('click',()=>{
  remaining-=Number(button.dataset.take);
  if(!remaining){paintCargo('You took the last crystal!');win('cargo');return;}
  const taken=remaining%4||1;
  remaining-=taken;
  paintCargo(remaining?'Station took '+taken+'. '+remaining+' crystals remain.':'The station took the last crystal.');
 }));
 cargo.querySelector('[data-restart]').addEventListener('click',()=>{remaining=15;paintCargo('15 crystals remain.');});
 paintCargo('15 crystals remain.');
 arcade.append(reward);

 const slide=game('slide','Satellite Shuffle','Slide neighboring tiles into the empty space. Put 1–8 in order with the empty space last.',grid);
 const tiles=board(slide);
 let order=[],slides=0,solved=false;
 const adjacent=(a,b)=>Math.abs(Math.floor(a/3)-Math.floor(b/3))+Math.abs(a%3-b%3)===1;
 function paintSlide(){
  solved=order.every((value,i)=>value===(i+1)%9);
  tiles.forEach((tile,i)=>{
   tile.textContent=order[i]||'□';
   tile.setAttribute('aria-label',order[i]?'Tile '+order[i]:'Empty space');
   tile.setAttribute('aria-disabled',String(solved||!adjacent(i,order.indexOf(0))));
  });
  message(slide,solved?'Satellite array restored in '+slides+' moves.':'Moves: '+slides);
 }
 function swapTile(index){
  const blank=order.indexOf(0);
  [order[blank],order[index]]=[order[index],order[blank]];
 }
 function resetSlide(){
  order=[1,2,3,4,5,6,7,8,0];slides=0;
  for(let step=0;step<15;step++){
   const next=order.map((_,i)=>i).filter(i=>adjacent(i,order.indexOf(0)));
   swapTile(next[Math.floor(Math.random()*next.length)]);
  }
  paintSlide();
 }
 tiles.forEach((tile,i)=>tile.addEventListener('click',()=>{
  if(solved||!adjacent(i,order.indexOf(0)))return;
  swapTile(i);slides++;paintSlide();
 }));
 slide.querySelector('[data-restart]').addEventListener('click',resetSlide);
 resetSlide();

 const fusion=game('fusion','Cosmic Elements','Stone beats Plasma, Plasma beats Ice, and Ice beats Stone. Win three hands before the station does.',
  '<div class="star-game-grid"><button type="button" data-element="0">Stone</button><button type="button" data-element="1">Plasma</button><button type="button" data-element="2">Ice</button></div>');
 const elements=Array.from(fusion.querySelectorAll('[data-element]'));
 let playerScore=0,stationScore=0;
 function resetFusion(){
  playerScore=stationScore=0;
  elements.forEach(button=>button.disabled=false);
  message(fusion,'Score: 0–0. Choose an element.');
 }
 elements.forEach(button=>button.addEventListener('click',()=>{
  const chosen=Number(button.dataset.element),opponent=Math.floor(Math.random()*3);
  let result='Draw.';
  if((chosen+1)%3===opponent){playerScore++;result='You win this hand.';}
  else if(chosen!==opponent){stationScore++;result='The station wins this hand.';}
  const done=playerScore===3||stationScore===3;
  if(done)elements.forEach(element=>element.disabled=true);
  message(fusion,'Station chose '+elements[opponent].textContent+'. '+result+' Score: '+playerScore+'–'+stationScore+
   (done?(playerScore===3?' You won the match!':' The station won the match.'):''));
 }));
 fusion.querySelector('[data-restart]').addEventListener('click',resetFusion);
 resetFusion();

 const pairs=game('pairs','Moon Match','Find four matching pairs. After a mismatch, choose the next card to turn the unmatched cards back over.',grid);
 const cards=board(pairs);
 cards.pop().remove();
 const symbols=['Moon','Comet','Ring','Star'];
 let deck=[],matched=new Set(),open=[];
 function paintPairs(){
  cards.forEach((card,i)=>{
   const visible=matched.has(i)||open.includes(i);
   card.textContent=visible?symbols[deck[i]]:'?';
   card.setAttribute('aria-label','Card '+(i+1)+(visible?', '+symbols[deck[i]]:', face down'));
   card.setAttribute('aria-disabled',String(matched.has(i)||open.includes(i)));
  });
 }
 function resetPairs(){
  deck=[0,0,1,1,2,2,3,3];matched=new Set();open=[];
  for(let i=deck.length-1;i>0;i--){
   const j=Math.floor(Math.random()*(i+1));
   [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  paintPairs();message(pairs,'Choose a card.');
 }
 cards.forEach((card,i)=>card.addEventListener('click',()=>{
  if(matched.has(i)||open.includes(i))return;
  if(open.length===2)open=[];
  open.push(i);
  if(open.length===1)message(pairs,symbols[deck[i]]+' revealed. Choose another card.');
  else if(deck[open[0]]===deck[i]){
   open.forEach(index=>matched.add(index));open=[];
   message(pairs,matched.size===8?'All four pairs found!':matched.size/2+' of 4 pairs found.');
  }else message(pairs,'Different symbols. Choose a new card.');
  paintPairs();
 }));
 pairs.querySelector('[data-restart]').addEventListener('click',resetPairs);
 resetPairs();

 const math=game('math','Launch Numbers','Solve five sums to fuel the rocket. Wrong answers can be retried.',
  '<p data-equation></p><form><label for="arcade-sum">Answer</label><input id="arcade-sum" type="number" step="1" required><button>Check</button></form>');
 const mathForm=math.querySelector('form'),answer=mathForm.querySelector('input');
 let sum=0,fuel=0;
 function equation(){
  const a=2+Math.floor(Math.random()*16),b=2+Math.floor(Math.random()*16);
  sum=a+b;
  math.querySelector('[data-equation]').textContent=a+' + '+b+' = ?';
  mathForm.reset();
 }
 function resetMath(){fuel=0;mathForm.hidden=false;equation();message(math,'Fuel: 0 of 5.');}
 mathForm.addEventListener('submit',event=>{
  event.preventDefault();
  if(answer.valueAsNumber!==sum){message(math,'Try that sum again.');answer.select();return;}
  fuel++;
  if(fuel===5){
   mathForm.hidden=true;
   message(math,'Launch complete! All five fuel cells are charged.');
   math.querySelector('[data-restart]').focus();
  }else{equation();message(math,'Fuel: '+fuel+' of 5.');answer.focus();}
 });
 math.querySelector('[data-restart]').addEventListener('click',resetMath);
 resetMath();

 const cipher=game('cipher','Starlock Cipher','Guess a three-digit code with distinct digits from 1–5. Each guess reveals how many digits are right and how many sit in the right place. You have eight guesses.',
  '<form><label for="arcade-code">Code</label><input id="arcade-code" type="text" inputmode="numeric" pattern="[1-5]{3}" maxlength="3" required><button>Decode</button></form><ol data-guess-log aria-label="Previous guesses"></ol>');
 const cipherForm=cipher.querySelector('form'),codeInput=cipherForm.querySelector('input'),log=cipher.querySelector('[data-guess-log]');
 let code=[],tries=0;
 function resetCipher(){
  const pool=['1','2','3','4','5'];
  code=Array.from({length:3},()=>pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
  tries=0;log.replaceChildren();cipherForm.hidden=false;cipherForm.reset();
  message(cipher,'Eight guesses remaining.');
 }
 cipherForm.addEventListener('submit',event=>{
  event.preventDefault();
  const guess=Array.from(codeInput.value);
  if(new Set(guess).size!==3){message(cipher,'Use three different digits.');codeInput.select();return;}
  tries++;
  const right=guess.filter(digit=>code.includes(digit)).length;
  const placed=guess.filter((digit,i)=>digit===code[i]).length;
  const entry=document.createElement('li');
  entry.textContent=guess.join('')+': '+right+' right digits, '+placed+' in place.';
  log.append(entry);
  if(placed===3||tries===8){
   cipherForm.hidden=true;
   message(cipher,placed===3?'Starlock opened!':'The code was '+code.join('')+'.');
   cipher.querySelector('[data-restart]').focus();
  }else{
   message(cipher,entry.textContent+' '+(8-tries)+' guesses remaining.');
   codeInput.select();
  }
 });
 cipher.querySelector('[data-restart]').addEventListener('click',resetCipher);
 resetCipher();
})();
