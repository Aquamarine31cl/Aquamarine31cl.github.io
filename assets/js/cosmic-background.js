(() => {
'use strict';
if(document.getElementById('cosmic-moving-stars'))return;
const canvas=document.createElement('canvas');canvas.id='cosmic-moving-stars';canvas.className='cosmic-moving-stars';canvas.setAttribute('aria-hidden','true');document.body.append(canvas);
const ctx=canvas.getContext('2d');if(!ctx){canvas.remove();return;}
const button=document.createElement('button');button.type='button';button.className='cosmic-background-toggle';document.body.append(button);
const reduce=matchMedia('(prefers-reduced-motion: reduce)');let selected=null;try{selected=localStorage.getItem('aquamarine.background.motion');}catch(e){}
let enabled=selected===null?!reduce.matches:selected==='play';let width=0,height=0,stars=[],frame=0,last=0,elapsed=0;
function resize(){width=innerWidth;height=innerHeight;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);stars=Array.from({length:width<600?44:90},(_,i)=>({x:((i*137.508)%997)/997*width,y:((i*89.317)%991)/991*height,r:.7+(i%4)*.35,speed:3+(i%5)*1.5,phase:i*1.7}));draw();}
function draw(){ctx.clearRect(0,0,width,height);for(const star of stars){const x=(star.x+elapsed*star.speed)%width;const y=(star.y+Math.sin(elapsed*.25+star.phase)*12+height)%height;ctx.globalAlpha=.35+.6*(.5+.5*Math.sin(elapsed*1.4+star.phase));ctx.fillStyle='#e1d5ff';ctx.beginPath();ctx.arc(x,y,star.r,0,Math.PI*2);ctx.fill();}const phase=elapsed%8;if(enabled&&phase<1.2){const x=width*.2+phase*width*.55,y=height*.12+phase*height*.23;const gradient=ctx.createLinearGradient(x-100,y-45,x,y);gradient.addColorStop(0,'rgba(179,201,255,0)');gradient.addColorStop(1,'rgba(225,235,255,.85)');ctx.globalAlpha=Math.sin(phase/1.2*Math.PI);ctx.strokeStyle=gradient;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-100,y-45);ctx.lineTo(x,y);ctx.stroke();}ctx.globalAlpha=1;}
function tick(now){frame=0;if(!active())return;const delta=Math.min((now-last)/1000,.05);last=now;elapsed+=delta;draw();frame=requestAnimationFrame(tick);}
function active(){return enabled&&!document.hidden&&document.documentElement.dataset.theme==='dark';}
function sync(){document.documentElement.dataset.backgroundMotion=enabled?'running':'paused';button.textContent=enabled?'Pause Background':'Play Background';button.setAttribute('aria-pressed',String(enabled));if(frame){cancelAnimationFrame(frame);frame=0;}if(active()){last=performance.now();frame=requestAnimationFrame(tick);}else draw();}
button.addEventListener('click',()=>{enabled=!enabled;selected=enabled?'play':'pause';try{localStorage.setItem('aquamarine.background.motion',selected);}catch(e){}sync();});
addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',()=>{if(selected===null){enabled=!reduce.matches;sync();}});new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});resize();sync();
})();
