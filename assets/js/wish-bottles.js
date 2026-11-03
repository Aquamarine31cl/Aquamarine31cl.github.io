(() => {
  'use strict';
  const panel=document.querySelector('.wish-panel');
  if(!panel) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const toggle=panel.querySelector('.wish-motion');
  let paused=reduced.matches, visible=true, frame=0, previous=0, time=0;
  const outline=panel.querySelector('.wish-glass'),length=outline.getTotalLength();
  const polygon=Array.from({length:600},(_,i)=>{const p=outline.getPointAtLength(length*i/600);return [p.x,p.y];});
  const rows=[];
  for(let y=28;y<165;y+=.2){
    const xs=[];
    for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
      const a=polygon[i],b=polygon[j];
      if((a[1]>y)!=(b[1]>y))xs.push(a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]));
    }
    xs.sort((a,b)=>a-b);
    let width=0;for(let i=0;i<xs.length;i+=2)width+=xs[i+1]-xs[i];
    rows.push({y,width});
  }
  const total=rows.reduce((s,r)=>s+r.width,0);
  const states=Array.from(panel.querySelectorAll('.wish-bottle'),(button,index)=>{
    const ratio=Math.max(0,Math.min(1,Number(button.dataset.value)/Number(button.dataset.capacity)));
    let sum=0,level=165;
    for(const r of rows.slice().reverse()){sum+=r.width;if(sum>=ratio*total){level=r.y;break;}}
    const state={button,index,level,ratio,angle:0,velocity:0,slope:0,slopeVelocity:0,
      vessel:button.querySelector('.wish-vessel'),fill:button.querySelector('.wish-fill'),
      liquid:button.querySelector('.wish-liquid'),surface:button.querySelector('.wish-surface')};
    state.fill.removeAttribute('transform');
    button.addEventListener('click',event=>{
      if(paused||reduced.matches)return;
      const box=button.getBoundingClientRect();
      const side=event.detail===0 ? 1 : (event.clientX-box.left<box.width/2 ? 1 : -1);
      // Add angular momentum to the current state; repeated taps do not restart the motion.
      state.velocity=Math.max(-100,Math.min(100,state.velocity+side*65));
      state.slopeVelocity+=side*.65;
      start();
    });
    return state;
  });
  function paint(s){
    s.vessel.setAttribute('transform','rotate('+s.angle.toFixed(3)+' 80 105)');
    // Counter-tilt the free surface towards world-horizontal, with delayed damped sloshing.
    const amplitude=s.ratio>.9?2.2:3.2;
    const coords=[];
    for(let x=-20;x<=180;x+=4){
      const wave=amplitude*Math.sin(x*.055-time*2.5+s.index*1.7)
        +.65*Math.sin(x*.105+time*1.8+s.index);
      const y=s.level+s.slope*(x-80)+wave;
      coords.push((x===-20?'M':'L')+x+' '+y.toFixed(3));
    }
    const edge=coords.join(' ');
    s.surface.setAttribute('d',edge);
    s.liquid.setAttribute('d',edge+' L180 195 L-20 195 Z');
  }
  function tick(now){
    frame=0;
    const dt=previous?Math.min((now-previous)/1000,.035):1/60;previous=now;
    time+=dt;
    // Semi-implicit integration with short substeps keeps the coupled springs stable.
    for(let n=0;n<3;n++)for(const s of states){
      const h=dt/3;
      const acceleration=-100*s.angle-5.2*s.velocity;
      s.velocity+=acceleration*h;s.angle+=s.velocity*h;
      const target=-Math.tan(s.angle*Math.PI/180);
      const fluidAcceleration=64*(target-s.slope)-4.2*s.slopeVelocity-.008*acceleration;
      s.slopeVelocity+=fluidAcceleration*h;s.slope+=s.slopeVelocity*h;
      s.slope=Math.max(-.3,Math.min(.3,s.slope));
      if(Math.abs(s.angle)<.0001&&Math.abs(s.velocity)<.001){s.angle=0;s.velocity=0;}
    }
    states.forEach(paint);
    if(!paused&&!reduced.matches&&!document.hidden&&visible)frame=requestAnimationFrame(tick);
  }
  function start(){if(!frame&&!paused&&!reduced.matches&&!document.hidden&&visible){previous=0;frame=requestAnimationFrame(tick);}}
  function sync(){
    if(frame)cancelAnimationFrame(frame);frame=0;previous=0;
    const stopped=paused||reduced.matches;
    panel.toggleAttribute('data-paused',stopped);
    panel.toggleAttribute('data-hidden',document.hidden||!visible);
    toggle.setAttribute('aria-pressed',String(stopped));
    toggle.setAttribute('aria-label',stopped?'Play Bottle Animations':'Pause Bottle Animations');
    toggle.textContent=stopped?'▷':'Ⅱ';
    if(reduced.matches){states.forEach(s=>{s.angle=s.velocity=s.slope=s.slopeVelocity=0;});}
    states.forEach(paint);start();
  }
  toggle.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();});
  document.addEventListener('visibilitychange',sync);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{
    visible=entries[0].isIntersecting;sync();
  },{rootMargin:'80px'}).observe(panel);

  let lastBottle='',lastTap=0,flareTimer=0;
  function flare(){
    if(reduced.matches||paused)return;
    panel.setAttribute('data-wish-flare','');clearTimeout(flareTimer);
    flareTimer=setTimeout(()=>panel.removeAttribute('data-wish-flare'),1500);
    states.forEach((s,i)=>{s.slopeVelocity+=(i?-.3:.3);});
    start();
  }
  panel.querySelectorAll('.wish-bottle').forEach(button=>button.addEventListener('click',()=>{
    if(reduced.matches||paused)return;
    flare();
    const now=Date.now(),id=button.dataset.wish;
    if(lastBottle&&lastBottle!==id&&now-lastTap<1600){
      document.dispatchEvent(new CustomEvent('sky-surprise',{detail:{message:'Twin stars - two little wishes share one sky.',strong:true}}));
      lastBottle='';lastTap=0;
    }else{lastBottle=id;lastTap=now;}
  }));
  document.addEventListener('sky-wish-released',flare);
  sync();
})();
