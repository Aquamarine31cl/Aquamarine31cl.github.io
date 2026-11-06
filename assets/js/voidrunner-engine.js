/* Fixed-step simulation shared by the browser and the headless checks. */
(() => {
 'use strict';
 const W=960,H=600;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function intersects(bullet,target,radius){
  const dx=bullet.x-bullet.oldX,dy=bullet.y-bullet.oldY;
  const t=clamp(((target.x-bullet.oldX)*dx+(target.y-bullet.oldY)*dy)/(dx*dx+dy*dy||1),0,1);
  return Math.hypot(bullet.oldX+t*dx-target.x,bullet.oldY+t*dy-target.y)<radius;
 }
 class Voidrunner {
  constructor(random=Math.random){this.random=random;this.reset();}
  reset(){
   this.phase='ready';this.wave=0;this.time=0;this.score=0;this.kills=0;
   this.player={x:480,y:300,vx:0,vy:0,angle:-Math.PI/2,hull:100,shield:65,heat:0,cooldown:0,invincible:0,lastHit:-10};
   this.upgrades={damage:1,engine:1,shield:1};this.bullets=[];this.enemies=[];this.effects=[];
   this.rocks=[{x:220,y:180,r:37},{x:735,y:180,r:42},{x:250,y:445,r:36},{x:710,y:438,r:33}];
  }
  start(){if(this.phase==='ready'){this.phase='playing';this.nextWave();}}
  nextWave(){
   this.wave++;this.spawned=0;this.spawnTimer=.8;this.quota=3+this.wave*2;
   this.player.shield=Math.min(65+this.upgrades.shield*10,this.player.shield+25);
  }
  chooseUpgrade(type){
   if(this.phase!=='upgrade'||!Object.hasOwn(this.upgrades,type))return;
   this.upgrades[type]++;this.player.hull=Math.min(100,this.player.hull+30);
   this.phase='playing';this.nextWave();
  }
  damage(entity,amount){
   if(entity===this.player){
    if(entity.invincible>0)return;
    const blocked=Math.min(entity.shield,amount);entity.shield-=blocked;entity.hull-=amount-blocked;
    entity.lastHit=this.time;entity.invincible=.18;
    if(entity.hull<=0){entity.hull=0;this.phase='lost';}
   }else entity.hull-=amount;
  }
  spawn(){
   const side=Math.floor(this.random()*4),t=.1+this.random()*.8;
   const x=side===0?30:side===1?W-30:t*W;
   const y=side===2?30:side===3?H-30:t*H;
   this.enemies.push({x,y,vx:0,vy:0,r:14,hull:30+this.wave*8,cooldown:1+this.random(),strafe:this.random()<.5?-1:1});
   this.spawned++;
  }
  shoot(entity,friendly){
   const angle=friendly?entity.angle:Math.atan2(this.player.y-entity.y,this.player.x-entity.x);
   const speed=friendly?510:210+this.wave*14;
   const x=entity.x+Math.cos(angle)*20,y=entity.y+Math.sin(angle)*20;
   this.bullets.push({x,y,oldX:x,oldY:y,vx:Math.cos(angle)*speed+(friendly?entity.vx*.4:0),vy:Math.sin(angle)*speed+(friendly?entity.vy*.4:0),life:2.4,friendly,damage:friendly?18+this.upgrades.damage*7:10});
  }
  move(entity,dt,radius){
   entity.x=clamp(entity.x+entity.vx*dt,radius,W-radius);
   entity.y=clamp(entity.y+entity.vy*dt,radius,H-radius);
   if(entity.x===radius||entity.x===W-radius)entity.vx*=-.35;
   if(entity.y===radius||entity.y===H-radius)entity.vy*=-.35;
   for(const rock of this.rocks){
    const d=distance(entity,rock),overlap=rock.r+radius-d;
    if(overlap<=0)continue;
    const nx=(entity.x-rock.x)/(d||1),ny=(entity.y-rock.y)/(d||1);
    entity.x+=nx*overlap;entity.y+=ny*overlap;
    const inward=entity.vx*nx+entity.vy*ny;
    if(inward<0){entity.vx-=nx*inward*1.4;entity.vy-=ny*inward*1.4;}
    if(entity===this.player&&inward<-70)this.damage(entity,Math.min(16,-inward*.04));
   }
  }
  step(dt,input={}){
   if(this.phase!=='playing')return;
   dt=Math.min(dt,1/60);this.time+=dt;
   const p=this.player;
   p.invincible=Math.max(0,p.invincible-dt);p.cooldown-=dt;
   p.heat=Math.max(0,p.heat-dt*25);
   if(this.time-p.lastHit>4)p.shield=Math.min(65+this.upgrades.shield*10,p.shield+dt*(5+this.upgrades.shield*2));
   p.angle+=((input.right?1:0)-(input.left?1:0))*dt*3.4;
   if(input.thrust){const force=150+this.upgrades.engine*40;p.vx+=Math.cos(p.angle)*force*dt;p.vy+=Math.sin(p.angle)*force*dt;}
   // Braking damps velocity exponentially, independent of display refresh rate.
   const drag=Math.exp(-dt*(input.brake?4.5:.22));p.vx*=drag;p.vy*=drag;
   const speed=Math.hypot(p.vx,p.vy),limit=220+this.upgrades.engine*22;
   if(speed>limit){p.vx*=limit/speed;p.vy*=limit/speed;}
   if(input.fire&&p.cooldown<=0&&p.heat<=82){this.shoot(p,true);p.heat+=18;p.cooldown=.16;}
   this.move(p,dt,13);
   this.spawnTimer-=dt;
   if(this.spawned<this.quota&&this.spawnTimer<=0){this.spawn();this.spawnTimer=1.8;}
   for(const enemy of this.enemies){
    const dx=p.x-enemy.x,dy=p.y-enemy.y,d=Math.hypot(dx,dy)||1;
    const approach=clamp((d-190)/90,-1,1),speed=65+this.wave*6;
    let vx=(dx/d*approach-dy/d*enemy.strafe*.6)*speed;
    let vy=(dy/d*approach+dx/d*enemy.strafe*.6)*speed;
    for(const rock of this.rocks){
     const gap=distance(enemy,rock);
     if(gap<rock.r+75){vx+=(enemy.x-rock.x)/(gap||1)*140;vy+=(enemy.y-rock.y)/(gap||1)*140;}
    }
    const ease=1-Math.exp(-dt*2);enemy.vx+=(vx-enemy.vx)*ease;enemy.vy+=(vy-enemy.vy)*ease;
    this.move(enemy,dt,enemy.r);enemy.cooldown-=dt;
    if(enemy.cooldown<=0&&d<520){this.shoot(enemy,false);enemy.cooldown=1.8-this.wave*.13;}
    if(distance(enemy,p)<27){this.damage(p,12);enemy.vx*=-1;enemy.vy*=-1;}
   }
   for(const bullet of this.bullets){
    bullet.oldX=bullet.x;bullet.oldY=bullet.y;bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.life-=dt;
    if(this.rocks.some(rock=>intersects(bullet,rock,rock.r)))bullet.life=0;
    if(bullet.life<=0)continue;
    const target=bullet.friendly?this.enemies.find(enemy=>enemy.hull>0&&intersects(bullet,enemy,enemy.r+2)):
     intersects(bullet,p,15)?p:null;
    if(target){this.damage(target,bullet.damage);bullet.life=0;}
   }
   for(const enemy of this.enemies.filter(e=>e.hull<=0)){
    this.score+=100*this.wave;this.kills++;
    this.effects.push({x:enemy.x,y:enemy.y,life:.45});
   }
   this.enemies=this.enemies.filter(e=>e.hull>0);this.bullets=this.bullets.filter(b=>b.life>0);
   this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);
   if(this.phase==='playing'&&this.spawned===this.quota&&!this.enemies.length){
    this.bullets=[];this.phase=this.wave===4?'won':'upgrade';
   }
  }
 }
 globalThis.Voidrunner=Voidrunner;
})();


