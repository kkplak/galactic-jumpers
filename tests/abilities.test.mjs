import test from 'node:test';
import assert from 'node:assert/strict';
import { Expedition } from '../src/game/engine.js';
import { STEP, makeLevel, PHYSICS } from '../src/game/levels.js';
import { hookTarget, HOOK_RANGE } from '../src/game/abilities.js';

const tick=(game,seconds,input={})=>{for(let i=0;i<Math.ceil(seconds/STEP);i++)game.step(STEP,input);};
const air=character=>{const game=new Expedition({character});game.level.platforms=game.level.platforms.slice(0,1);game.level.collectibles=[];game.level.enemies=[];return game;};

test('Pip tail jump is one ground-launched leap, with no air recharge or jetpack',()=>{
  const game=air('pip');game.step(STEP,{boost:true});
  assert(game.player.vy>900);assert.equal(game.player.fuel,0);assert.equal(game.player.jumps,2);
  const launch=game.drainEvents();assert.equal(launch.filter(e=>e.type==='tail').length,1);
  tick(game,.35,{boost:true});const vy=game.player.vy;
  game.step(STEP,{});game.step(STEP,{boost:true});
  assert(game.player.vy<vy);assert.equal(game.player.fuel,0);assert(!game.drainEvents().some(e=>e.type==='tail'));
  tick(game,2);assert(game.maxHeight>390);assert(game.player.grounded);assert.equal(game.player.fuel,100);
  game.step(STEP,{boost:true});assert(game.drainEvents().some(e=>e.type==='tail'));
  const jumping=air('pip');jumping.step(STEP,{jump:true});tick(jumping,.2);jumping.step(STEP,{boost:true});
  assert.equal(jumping.player.fuel,100);assert(!jumping.drainEvents().some(e=>e.type==='tail'));
});

test('Bop hooks a reachable gear, follows its platform, releases, and resets on landing',()=>{
  const game=new Expedition({character:'bop'}),anchor=game.level.anchors[0],target=game.platform(anchor.platformId),from=game.platform(anchor.platformId-1);
  game.level.enemies=[];game.level.collectibles=[];
  assert.equal(hookTarget(game),null);
  Object.assign(game.player,{x:from.x,y:from.y,grounded:true,groundId:from.id,lastLandY:from.y,lastPlatformId:from.id});
  assert.equal(hookTarget(game),anchor);
  game.step(STEP,{boost:true});assert.equal(game.player.grapple.platformId,target.id);assert.equal(game.player.fuel,0);
  const startY=game.player.y;
  target.amplitude=22;tick(game,.4,{boost:true});assert(game.player.y>startY+60);assert(game.player.grapple);
  const frozen=structuredClone(game.player);game.state='paused';tick(game,1,{boost:true});assert.deepEqual(game.player,frozen);game.state='playing';
  game.step(STEP,{});assert.equal(game.player.grapple,null);
  game.step(STEP,{boost:true});assert.equal(game.player.grapple,null,'Cannot repeatedly reel in without landing');
  Object.assign(game.player,{x:target.x,y:target.y+1,vy:-200,grounded:false,groundId:-1});
  game.step(STEP,{});assert.equal(game.player.groundId,target.id);assert.equal(game.player.fuel,100);
  assert.equal(hookTarget(game),null,'Completed anchors do not pull Bop backward');
});

test('each Pip and Bop chapter has an ability gate beyond ordinary double-jump height',()=>{
  for(const character of ['pip','bop'])for(let index=0;index<6;index++){
    const level=makeLevel(index,false,character),gates=level.platforms.filter(p=>p.approach);
    assert(gates.length>0);
    const maximumDouble=PHYSICS.jump**2/level.gravity;
    assert(gates.some(p=>p.y-level.platforms[p.id-1].y>maximumDouble+50));
    if(character==='bop')for(const anchor of level.anchors){
      const platform=level.platforms[anchor.platformId],from=level.platforms[anchor.platformId-1];
      assert(Math.hypot(platform.x-from.x,platform.y+anchor.offsetY-(from.y+28))<=HOOK_RANGE);
    }
  }
});
