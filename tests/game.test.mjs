import test from 'node:test';
import assert from 'node:assert/strict';
import { Expedition } from '../src/game/engine.js';
import { makeLevel, MISSIONS, STEP, PHYSICS, LEVEL_REVISION } from '../src/game/levels.js';
import { SaveStore, validateSave, characterUnlocked, worldFinished } from '../src/game/storage.js';

const advance = (game, seconds, input = {}) => {for(let i=0;i<Math.round(seconds/STEP);i++)game.step(STEP,typeof input==='function'?input(i):input);};
const emptyAir = () => {const game=new Expedition();game.level.platforms=game.level.platforms.slice(0,1);game.level.collectibles=[];game.level.enemies=[];return game;};

test('a normal jump, variable-height release, and double jump have distinct useful trajectories',()=>{
  const single=emptyAir(),short=emptyAir(),double=emptyAir();
  single.step(STEP,{jump:true});short.step(STEP,{jump:true});double.step(STEP,{jump:true});
  advance(single,.9);advance(short,.9,i=>({jumpReleased:i===8}));advance(double,.9,i=>({jump:i===40}));
  assert(single.maxHeight>100&&single.maxHeight<115);
  assert(short.maxHeight<single.maxHeight-20);
  assert(double.maxHeight>single.maxHeight+65);
});

test('coyote time permits a jump just after leaving an edge',()=>{
  const game=new Expedition();const ledge=game.platform(1);
  Object.assign(game.player,{x:ledge.x+ledge.w/2+13,y:ledge.y,grounded:true,groundId:1,lastLandY:ledge.y});game.step(STEP,{});
  assert.equal(game.player.grounded,false);
  advance(game,.055);game.step(STEP,{jump:true});
  assert(game.player.vy>400);assert.equal(game.player.jumps,1);
});

test('a buffered jump fires on landing without allowing a third air jump',()=>{
  const game=emptyAir();Object.assign(game.player,{y:6,vy:-150,grounded:false,jumps:2,coyote:0,groundId:-1});
  game.step(STEP,{jump:true});assert(game.player.vy<0);
  advance(game,.09);assert(game.player.vy>300);assert.equal(game.player.jumps,1);
});

test('jetpack burns a bounded fuel supply, then recharges only on a platform',()=>{
  const game=emptyAir();advance(game,2, {boost:true});
  assert(game.player.y>250);assert(Math.abs(game.player.fuel-28)<.1);
  const fuel=game.player.fuel;advance(game,.1);assert.equal(game.player.fuel,fuel);
  Object.assign(game.player,{x:240,y:0,vy:0,grounded:true,groundId:0});advance(game,1.7);
  assert.equal(game.player.fuel,100);
});

test('one-way platforms catch a fast fall without tunneling',()=>{
  const game=new Expedition();const platform=game.platform(3);
  Object.assign(game.player,{x:platform.x,y:platform.y+1,vy:-690,grounded:false,groundId:-1,lastLandY:platform.y+20});
  game.step(STEP,{});assert.equal(game.player.y,platform.y);assert.equal(game.player.groundId,3);
});

test('moving platforms carry a resting explorer and fragile platforms recover',()=>{
  const game=new Expedition({index:5});const moving=game.level.platforms.find(p=>p.type==='moving');game.level.enemies=[];
  Object.assign(game.player,{x:moving.x,y:moving.y,grounded:true,groundId:moving.id,lastLandY:moving.y});advance(game,.4);
  assert(Math.abs(game.player.x-moving.x)<.01);
  const fragile=game.level.platforms.find(p=>p.type==='fragile');
  Object.assign(game.player,{x:fragile.x,y:fragile.y,grounded:true,groundId:fragile.id,lastLandY:fragile.y});
  advance(game,.73);assert.equal(fragile.broken,true);
  game.respawn();assert.equal(fragile.broken,false);
});

test('damage consumes one shield, respawns safely, and respects invulnerability',()=>{
  const game=new Expedition();game.checkpoint=4;
  game.damage('sentinel');assert.equal(game.health,2);assert.equal(game.player.y,game.platform(4).y);
  game.damage('sentinel');assert.equal(game.health,2);
  game.player.invulnerable=0;game.damage('fall');assert.equal(game.health,1);
  game.player.invulnerable=0;game.damage('fall');assert.equal(game.state,'ended');assert.equal(game.result.won,false);
  game.finish(true);assert.equal(game.result.won,false);
});

test('crystals cannot be farmed after checkpoint restoration',()=>{
  const game=new Expedition();const item=game.level.collectibles[0];
  Object.assign(game.player,{x:item.x,y:item.y-23});game.step(STEP,{});
  const count=game.crystals;assert(count>=1);
  const saved=game.snapshot();const restored=new Expedition({snapshot:saved});
  Object.assign(restored.player,{x:item.x,y:item.y-23});restored.step(STEP,{});
  assert.equal(restored.crystals,count);
});

test('a beacon requires crystals, then completes once and unlocks the next mission',()=>{
  const game=new Expedition();const goal=game.level.goal;
  Object.assign(game.player,{x:goal.x,y:goal.y,grounded:true,groundId:goal.platformId,lastLandY:goal.y});game.step(STEP,{});
  assert.equal(game.state,'playing');assert(game.drainEvents().some(e=>e.type==='goalLocked'));
  for(const c of game.level.collectibles.filter(c=>c.type==='crystal').slice(0,goal.required))game.collected.add(c.id);
  game.step(STEP,{});assert.equal(game.result.won,true);
  const storage={getItem:()=>null,setItem:()=>{}};const save=new SaveStore(storage);save.complete(game.result);
  assert.equal(save.data.unlocked,1);assert(save.data.missions[0].stars>=1);assert.equal(save.data.activeRun,null);
});

test('pause freezes the simulation; timed climb ends at exactly two minutes',()=>{
  const game=new Expedition({mode:'endless'});game.state='paused';advance(game,3);assert.equal(game.elapsed,0);
  game.state='playing';advance(game,121);assert.equal(game.state,'ended');assert.equal(game.elapsed,120);assert.equal(game.result.reason,'time');
});

test('assist mode and active-run settings survive a save/reload round trip',()=>{
  const game=new Expedition({index:2,assist:true});game.checkpoint=game.level.platforms.find(p=>p.type==='checkpoint').id;game.elapsed=48;game.health=4;
  const store=new SaveStore({getItem:()=>null,setItem:()=>{}});store.data.unlocked=2;store.data.activeRun=game.snapshot();
  const clean=validateSave(JSON.parse(JSON.stringify(store.data)));const restored=new Expedition({index:2,snapshot:clean.activeRun});
  assert.equal(restored.maxHealth,5);assert.equal(restored.health,4);assert.equal(restored.elapsed,48);assert.equal(restored.player.y,restored.platform(game.checkpoint).y);
});

test('malformed or blocked browser storage cannot prevent playing',()=>{
  const save=new SaveStore({getItem:()=>'{broken',setItem:()=>{throw Error('quota');}});
  assert.equal(save.data.unlocked,0);assert.equal(save.write(),false);
  const invalid=validateSave({version:1,unlocked:Infinity,missions:[{stars:99,bestTime:-3}],settings:{assist:'yes'},activeRun:{index:900}});
  assert.equal(invalid.unlocked,0);assert.equal(invalid.missions[0].stars,3);assert.equal(invalid.settings.assist,false);assert.equal(invalid.activeRun,null);
});

// This controller uses only public movement/jump/boost inputs. It follows the
// visible main route, waits for lift transfers, and refuels before big flights.
// Enemy collisions are tested separately to isolate route/fuel reachability.
function followRoute(game, limit=24000) {
  let target=1,needsDouble=false,launchY=0,launchX=240,boostRoute=false;
  const used={boost:0,tail:0,hook:0,ride:0,hurt:0,landings:new Set()};
  for(let frame=0;frame<limit&&game.state==='playing';frame++) {
    const p=game.player;
    if(p.grounded) {
      target=p.groundId+1;launchY=p.y;launchX=p.x;
      const next=game.platform(target);if(!next)break;
      boostRoute=!!next.approach;
      needsDouble=next.y-p.y>94||Math.abs(next.x-p.x)>170||next.rise>0;
    }
    const next=game.platform(target);if(!next)break;
    let aim=next.x;
    if(boostRoute) {
      const t=Math.max(0,Math.min(1,(p.y-launchY)/(next.y-launchY)));
      aim=launchX+(next.x-launchX)*t;
    }
    const input={left:aim-p.x < -7,right:aim-p.x > 7};
    if(p.grounded) {
      const ground=game.platform(p.groundId);
      const waitForLift=(ground.rise&&next.y-p.y>145)||(next.rise&&next.y-p.y>160);
      if(waitForLift||(boostRoute&&p.fuel<95)) {
        input.left=ground.x-p.x < -7;input.right=ground.x-p.x > 7;
        if(ground.rise)used.ride++;
      } else if(boostRoute&&game.character!=='nova') {input.boost=!p.abilityHeld;}
      else {input.jump=true;if(boostRoute)input.boost=true;}
    } else if(boostRoute) input.boost=game.character==='nova'?p.y<next.y+10:game.character==='bop'&&!!p.grapple;
    else if(needsDouble&&p.jumps===1&&p.vy<80) input.jump=true;
    if(input.boost)used.boost++;
    game.step(STEP,input);
    for(const event of game.drainEvents()) {
      if(['hurt','tail','hook'].includes(event.type))used[event.type]++;
      if(event.type==='land')used.landings.add(game.player.groundId);
    }
  }
  return {target,...used};
}

for(let index=0;index<MISSIONS.length;index++)test(`mission ${index+1}: complete ${MISSIONS[index].activity.toLowerCase()} with public inputs`,()=>{
  const game=new Expedition({index});game.level.enemies=[];
  const used=followRoute(game);
  assert.equal(game.result?.won,true,`Stopped at ${game.player.y}, checkpoint ${game.checkpoint}, target ${used.target}`);
  assert.equal(used.hurt,0,'The authored route needs no sacrificial falls');
  assert(game.crystals>=game.level.goal.required);assert(game.elapsed<MISSIONS[index].par);
  if(index===1||index===5)assert(used.ride>0,'The controller rides a lift before transferring');
  if(index===3||index===5)assert(used.boost>0,'Tall flight sections use the jetpack');
});

test('all 18 story chapters can finish with creatures enabled in normal and extra-help modes',()=>{
  for(const character of ['nova','pip','bop'])for(const assist of [false,true])for(let index=0;index<6;index++) {
    const game=new Expedition({index,assist,character});const used=followRoute(game);
    if(character!=='nova')assert(used[character==='pip'?'tail':'hook']>0,`${character} must use their own ability`);
    assert.equal(game.result?.won,true,`${character}, chapter ${index+1}, assist ${assist}, y ${game.player.y}, cp ${game.checkpoint} should remain finishable with the basic route controller`);
  }
});

test('one saved adventure completes Nova, then Pip, then Bop, and keeps all friends for replay',()=>{
  let stored=null;const storage={getItem:()=>stored,setItem:(_key,value)=>{stored=value;}};
  let save=new SaveStore(storage);
  assert.equal(save.data.character,'nova');assert.equal(save.chooseCharacter('pip'),false);assert.equal(save.chooseCharacter('bop'),false);
  for(const [world,character] of ['nova','pip','bop'].entries())for(let index=0;index<6;index++){
    assert.equal(save.data.character,character);assert.equal(save.data.unlocked,index);
    const game=new Expedition({index,character});followRoute(game);assert(game.result.won);
    save.complete(game.result);save=new SaveStore(storage);
    assert(save.data.journeys[character].missions[index].stars>0);
    if(index===5){assert(worldFinished(save.data,character));assert.equal(save.data.character,['pip','bop','bop'][world]);}
  }
  for(const character of ['nova','pip','bop']){assert(characterUnlocked(save.data,character));assert(save.chooseCharacter(character));assert.equal(save.data.unlocked,5);}
});

test('authored worlds are deterministic, with bounded collectibles and three optional relics',()=>{
  for(let index=0;index<6;index++){
    const a=makeLevel(index),b=makeLevel(index);assert.deepEqual(a,b);
    assert.equal(a.collectibles.filter(c=>c.type==='relic').length,3);
    assert(a.goal.required<a.collectibles.filter(c=>c.type==='crystal').length);
    assert.equal(a.platforms[a.goal.platformId].type,'checkpoint');
    for(const item of a.collectibles){assert(item.x>0&&item.x<480);assert(item.y>0&&item.y<a.height+120);}
    for(const platform of a.platforms) {
      assert(platform.x-platform.amplitude-platform.w/2>=0);
      assert(platform.x+platform.amplitude+platform.w/2<=480);
    }
  }
});

test('a lift carries the explorer and its pickups through a full up-and-down cycle',()=>{
  const game=new Expedition({index:1}),platform=game.level.platforms.find(p=>p.rise),relic=game.level.collectibles.find(c=>c.platformId===platform.id&&c.type==='relic');
  Object.assign(game.player,{x:platform.x,y:platform.y,grounded:true,groundId:platform.id,lastLandY:platform.y});
  for(let frame=0;frame<Math.ceil(2*Math.PI/platform.speed/STEP);frame++) {
    game.step(STEP,{});game.drainEvents();
    assert(Math.abs(game.player.y-platform.y)<.01);
    assert.equal(relic.y,platform.y+relic.offsetY);
  }
  assert(game.maxHeight>=platform.baseY+platform.rise-.01);assert.equal(game.health,3);
});

test('a rising lift catches feet from above but remains passable from below',()=>{
  const game=new Expedition({index:1}),platform=game.level.platforms.find(p=>p.rise);
  game.elapsed=1;game.step(STEP,{});
  Object.assign(game.player,{x:platform.x,y:platform.y+.1,vy:1,grounded:false,groundId:-1,coyote:0,lastLandY:platform.y});
  game.step(STEP,{});assert.equal(game.player.groundId,platform.id);
  Object.assign(game.player,{y:platform.y-8,vy:300,grounded:false,groundId:-1,coyote:0});
  game.step(STEP,{});assert.equal(game.player.grounded,false);assert(game.player.vy>0);
});

test('golden pads refill fuel on landing, while moon gravity changes the jump arc',()=>{
  const game=new Expedition({index:3}),pad=game.level.platforms.find(p=>p.type==='refuel');
  Object.assign(game.player,{x:pad.x,y:pad.y+1,vy:-200,grounded:false,groundId:-1,fuel:5,lastLandY:pad.y});
  game.step(STEP,{});assert.equal(game.player.fuel,100);assert(game.drainEvents().some(e=>e.type==='refuel'));
  const normal=emptyAir(),moon=emptyAir();moon.level.gravity=makeLevel(4).gravity;
  normal.step(STEP,{jump:true});moon.step(STEP,{jump:true});advance(normal,1.4);advance(moon,1.4);
  assert(moon.maxHeight>normal.maxHeight*1.55);assert.equal(moon.player.fuel,100);
});

test('a route revision restarts only the active checkpoint and preserves earned progress',()=>{
  const source={version:1,unlocked:4,missions:[{stars:3,bestScore:8500,relics:2}],settings:{music:false,assist:true},activeRun:{index:2,checkpoint:8,collected:['c1-0'],health:2,elapsed:20}};
  const store=new SaveStore({getItem:()=>JSON.stringify(source),setItem:()=>{}});
  assert.equal(store.restartedIndex,2);assert.equal(store.data.activeRun,null);
  assert.equal(store.data.unlocked,4);assert.equal(store.data.missions[0].stars,3);assert.equal(store.data.missions[0].bestScore,8500);assert.equal(store.data.settings.music,false);
  const game=new Expedition({index:3});game.collected.add('c2-4');store.data.activeRun=game.snapshot();
  const clean=validateSave(store.data);assert.equal(clean.activeRun.revision,LEVEL_REVISION);assert.deepEqual(clean.activeRun.collected,['c2-4']);
});

test('the timed challenge includes stair runs, columns, drifting rocks, and fueled flights',()=>{
  const a=makeLevel(0,true),b=makeLevel(4,true);
  assert.deepEqual(a.platforms,b.platforms);assert.equal(a.gravity,PHYSICS.gravity);assert.equal(b.gravity,PHYSICS.gravity);
  assert(a.height>PHYSICS.jump*120,'The course cannot run out before the timer');
  assert(a.trails.length>0);assert(a.platforms.some(p=>p.type==='fragile'));assert(a.platforms.some(p=>p.amplitude));
  for(const character of ['nova','pip','bop']){
    const game=new Expedition({mode:'endless',character});game.level.enemies=[];const used=followRoute(game);
    assert.equal(game.result?.reason,'time');assert.equal(used.hurt,0);assert(used.boost>0);assert(game.maxHeight>4000);
  }
});
