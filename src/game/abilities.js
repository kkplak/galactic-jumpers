import { PHYSICS } from './levels.js';

export const TAIL_JUMP = 940;
export const HOOK_RANGE = 565;
const approach=(value,target,amount)=>value<target?Math.min(target,value+amount):Math.max(target,value-amount);

export function hookTarget(game) {
  const p=game.player;
  return game.level.anchors.find(anchor=>{
    const platform=game.platform(anchor.platformId);
    return platform&&!platform.broken&&platform.id>p.lastPlatformId&&platform.y>p.lastLandY+30&&
      Math.hypot(platform.x-p.x,platform.y+anchor.offsetY-(p.y+28))<=HOOK_RANGE;
  })??null;
}

export function updateAbility(game,input,dt,canLaunch) {
  const p=game.player,pressed=!!input.boost&&!p.abilityHeld;
  p.abilityHeld=!!input.boost;p.tailTime=Math.max(0,p.tailTime-dt);p.boosting=false;
  if(game.character==='nova'){
    p.boosting=!!input.boost&&p.fuel>0;
    if(p.boosting){p.fuel=Math.max(0,p.fuel-PHYSICS.fuelUse*dt);p.vy=Math.min(345,p.vy+PHYSICS.boost*dt);p.grounded=false;p.groundId=-1;}
    else if(p.grounded)p.fuel=Math.min(100,p.fuel+PHYSICS.fuelRegen*dt);
    return;
  }
  if(game.character==='pip'){
    if(pressed&&canLaunch&&p.fuel>=99){
      p.vy=TAIL_JUMP;p.grounded=false;p.groundId=-1;p.coyote=0;p.buffer=0;p.jumps=2;p.fuel=0;p.tailTime=.55;
      game.emit('tail',{x:p.x,y:p.y});
    }
    p.boosting=p.tailTime>0;return;
  }
  if(p.grapple&&(!input.boost||input.jump))p.grapple=null;
  if(input.boost&&!input.jump&&!p.grapple&&p.fuel>=99){
    const anchor=hookTarget(game);
    if(anchor){p.grapple={platformId:anchor.platformId,offsetY:anchor.offsetY};p.fuel=0;p.grounded=false;p.groundId=-1;p.coyote=0;p.jumps=Math.max(1,p.jumps);game.emit('hook',{x:p.x,y:p.y});}
  }
  if(p.grapple){
    const target=game.platform(p.grapple.platformId);
    const dx=target.x-p.x,dy=target.y+p.grapple.offsetY-(p.y+28),distance=Math.hypot(dx,dy);
    if(target.broken||distance<20){p.grapple=null;p.vy=Math.max(p.vy,170);}
    else {
      p.vx=approach(p.vx,dx/distance*440,2000*dt);
      p.vy=approach(p.vy,dy/distance*440,2300*dt)+game.level.gravity*dt;
      p.boosting=true;
    }
  }
}
