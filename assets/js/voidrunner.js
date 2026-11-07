(() => {
 'use strict';
 const game=document.querySelector('[data-voidrunner]');
 if(!game||!globalThis.Voidrunner)return;
 const canvas=game.querySelector('canvas'),ctx=canvas.getContext('2d');
 if(!ctx)return;
 const model=new Voidrunner(),input={},reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const status=game.querySelector('[data-flight-status]'),hud=game.querySelector('[data-flight-hud]');
 const upgrades=game.querySelector('[data-flight-upgrades]');
 const start=game.querySelector('[data-flight-start]'),pause=game.querySelector('[data-flight-pause]');
 let paused=false,frame=0,last=0,accumulator=0,lastPhase='',lastHud='';
 const keys={ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right',ArrowUp:'thrust',w:'thrust',ArrowDown:'brake',s:'brake',' ':'fire',Shift:'brake'};
 function clear(){for(const key of Object.keys(input))delete input[key];}
 function paint(){
  ctx.fillStyle='#080f24';ctx.fillRect(0,0,960,600);
  for(let i=0;i<130;i++){
   ctx.globalAlpha=.25+(i%5)*.12;ctx.fillStyle=i%3?'#c5d7ff':'#c6a8eb';
   ctx.fillRect((i*173)%960,(i*97)%600,1+(i%3)*.4,1+(i%3)*.4);
  }
  ctx.globalAlpha=1;
  for(const rock of model.rocks){
   ctx.fillStyle='#222c46';ctx.strokeStyle='#687797';ctx.lineWidth=2;
   ctx.beginPath();
   for(let n=0;n<9;n++){
    const a=n*Math.PI*2/9,r=rock.r*(.86+(n%3)*.07),x=rock.x+Math.cos(a)*r,y=rock.y+Math.sin(a)*r;
    if(n)ctx.lineTo(x,y);else ctx.moveTo(x,y);
   }
   ctx.closePath();ctx.fill();ctx.stroke();
  }
  for(const enemy of model.enemies){
   ctx.save();ctx.translate(enemy.x,enemy.y);ctx.rotate(Math.atan2(model.player.y-enemy.y,model.player.x-enemy.x));
   ctx.fillStyle='#f18da7';ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-12,-12);ctx.lineTo(-7,0);ctx.lineTo(-12,12);ctx.closePath();ctx.fill();ctx.restore();
   ctx.fillStyle='#f5c2d2';ctx.fillRect(enemy.x-14,enemy.y-23,28*Math.max(0,enemy.hull)/(30+model.wave*8),3);
  }
  for(const b of model.bullets){ctx.strokeStyle=b.friendly?'#b6fff1':'#ffb4b9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-b.vx*.025,b.y-b.vy*.025);ctx.stroke();}
  const p=model.player;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
  if(input.thrust&&model.phase==='playing'&&!paused){ctx.fillStyle='#eaca83';ctx.beginPath();ctx.moveTo(-10,-5);ctx.lineTo(-24,0);ctx.lineTo(-10,5);ctx.fill();}
  ctx.fillStyle='#b0f1e8';ctx.beginPath();ctx.moveTo(19,0);ctx.lineTo(-12,-11);ctx.lineTo(-6,0);ctx.lineTo(-12,11);ctx.closePath();ctx.fill();
  if(p.shield>0){ctx.strokeStyle='#8de8f080';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.stroke();}ctx.restore();
  if(!reduced.matches)for(const effect of model.effects){ctx.strokeStyle='#f4cfaa';ctx.globalAlpha=effect.life/.45;ctx.beginPath();ctx.arc(effect.x,effect.y,(.45-effect.life)*85+4,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;
  const text='Wave '+model.wave+' / 4 · Hull '+Math.ceil(p.hull)+' · Shield '+Math.ceil(p.shield)+' · Heat '+Math.ceil(p.heat)+'% · Speed '+Math.round(Math.hypot(p.vx,p.vy))+' · Score '+model.score;
  if(text!==lastHud){hud.textContent=text;lastHud=text;}
  if(model.phase!==lastPhase){
   lastPhase=model.phase;upgrades.hidden=model.phase!=='upgrade';
   status.textContent={ready:'Ready. Select Launch, then steer and fire.',playing:'Flight active. Asteroids block both friendly and hostile fire.',upgrade:'Sector clear. Choose one upgrade to enter the next wave.',lost:'Ship lost. Restart the sortie to try a different approach.',won:'Extraction complete. All four sectors cleared.'}[model.phase];
  }
  pause.disabled=model.phase!=='playing';pause.textContent=paused?'Resume Flight':'Pause Flight';pause.setAttribute('aria-pressed',String(paused));
 }
 function stop(){cancelAnimationFrame(frame);frame=0;last=0;accumulator=0;}
 function active(){return model.phase==='playing'&&!paused&&!document.hidden;}
 function tick(now){
  frame=0;if(!active())return;
  accumulator+=last?Math.min((now-last)/1000,.08):0;last=now;
  while(accumulator>=1/120){model.step(1/120,input);accumulator-=1/120;}
  paint();if(active())frame=requestAnimationFrame(tick);else clear();
 }
 function sync(){stop();paint();if(active())frame=requestAnimationFrame(tick);}
 start.addEventListener('click',()=>{model.reset();model.start();paused=false;clear();sync();canvas.focus();});
 pause.addEventListener('click',()=>{paused=!paused;clear();sync();});
 for(const button of upgrades.querySelectorAll('[data-upgrade]'))button.addEventListener('click',()=>{
  model.chooseUpgrade(button.dataset.upgrade);clear();sync();canvas.focus();
 });
 game.addEventListener('keydown',event=>{
  if(event.ctrlKey||event.metaKey||event.altKey)return;
  if(event.target.matches('button')&&event.key===' ')return;
  const key=keys[event.key]||keys[event.key.toLowerCase()];
  if(key&&active()){event.preventDefault();input[key]=true;}
  if(event.key.toLowerCase()==='p'&&!event.repeat&&model.phase==='playing'){paused=!paused;clear();sync();}
 });
 game.addEventListener('keyup',event=>{const key=keys[event.key]||keys[event.key.toLowerCase()];if(key){delete input[key];event.preventDefault();}});
 for(const button of game.querySelectorAll('[data-flight-control]')){
  const key=button.dataset.flightControl;
  button.addEventListener('pointerdown',event=>{if(!active()||event.button!==0)return;event.preventDefault();button.setPointerCapture(event.pointerId);input[key]=true;});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,()=>delete input[key]);
  button.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&active()){event.preventDefault();input[key]=true;}});
  button.addEventListener('keyup',event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();delete input[key];}});
 }
 function suspend(){if(model.phase==='playing')paused=true;clear();sync();}
 addEventListener('blur',suspend);addEventListener('pagehide',()=>{paused=true;clear();stop();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});
 game.addEventListener('focusout',event=>{if(!game.contains(event.relatedTarget))suspend();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)suspend();}).observe(canvas);
 function resize(){
  const width=Math.max(320,canvas.clientWidth),ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.round(width*ratio);canvas.height=Math.round(width*600/960*ratio);
  ctx.setTransform(canvas.width/960,0,0,canvas.height/600,0,0);paint();
 }
 if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);
 addEventListener('resize',resize);reduced.addEventListener('change',paint);resize();
})();
