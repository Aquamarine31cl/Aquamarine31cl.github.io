(() => {
 'use strict';
 const game=document.querySelector('.star-game');
 if(!game)return;
 const status=game.querySelector('[data-game-status]');
 const list=game.querySelector('.star-game-sequence');
 const grid=game.querySelector('.star-game-grid');
 const action=game.querySelector('[data-game-action]');
 const stars=Array.from(grid.querySelectorAll('[data-star]'));
 let sequence=[],position=0,phase='idle';

 function study(){
  position=0;
  phase='study';
  grid.hidden=true;
  list.replaceChildren(...sequence.map(number=>{
   const item=document.createElement('li');
   item.textContent=number;
   return item;
  }));
  list.hidden=false;
  status.textContent='Round '+(sequence.length-2)+' of 5. Memorize the sequence.';
  action.textContent='Hide Sequence and Play';
  action.focus();
 }

 function finish(message){
  phase='idle';
  status.textContent=message;
  action.textContent='Play Again';
  action.hidden=false;
  grid.hidden=true;
  action.focus();
 }

 action.addEventListener('click',()=>{
  if(phase==='study'){
   phase='play';
   list.hidden=true;
   grid.hidden=false;
   action.hidden=true;
   status.textContent='Choose the stars in order.';
   stars[0].focus();
   return;
  }
  game.removeAttribute('data-won');
  sequence=Array.from({length:3},()=>1+Math.floor(Math.random()*4));
  study();
 });

 for(const star of stars)star.addEventListener('click',()=>{
  if(phase!=='play')return;
  if(Number(star.dataset.star)!==sequence[position]){
   finish('That star was out of order. Try a new constellation.');
   return;
  }
  star.dataset.hit='';
  position++;
  if(position<sequence.length){
   status.textContent=position+' of '+sequence.length+' stars matched.';
   return;
  }
  if(sequence.length===7){
   game.dataset.won='';
   finish('Aurora Crown discovered. You remembered all five constellations!');
   return;
  }
  sequence.push(1+Math.floor(Math.random()*4));
  action.hidden=false;
  study();
 });
 grid.addEventListener('animationend',event=>event.target.removeAttribute('data-hit'));
 action.hidden=false;
})();
