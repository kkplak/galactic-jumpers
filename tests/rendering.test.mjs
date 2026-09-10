import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ATLAS_FILES } from '../src/game/assets.js';
import { Expedition } from '../src/game/engine.js';
import { platformArtwork, collapseShake } from '../src/game/platform-art.js';
import { Renderer } from '../src/game/renderer.js';

const metadata=JSON.parse(readFileSync(new URL('../public/assets/sprites.json',import.meta.url),'utf8'));

test('fragile warnings shake only during the countdown and honor calmer-screen mode',()=>{
  const platform={id:3,type:'fragile',crumble:.6,broken:false};
  const offsets=Array.from({length:20},(_,i)=>collapseShake(platform,i/60));
  assert(Math.max(...offsets)-Math.min(...offsets)>2);
  assert.equal(collapseShake(platform,1),collapseShake(platform,1),'Paused simulation time holds the warning still');
  for(const changed of [{crumble:0},{broken:true},{type:'stone'}])assert.equal(collapseShake({...platform,...changed},1),0);
  assert.equal(collapseShake(platform,1,true),0);
  const {renderer,operations}=fixture(),game=new Expedition({index:2});
  const fragile=game.level.platforms.find(p=>p.type==='fragile');fragile.crumble=.3;
  Object.assign(game.player,{x:fragile.x,y:fragile.y});renderer.reset(game);renderer.draw(game,0);
});

test('every painted landing span maps to both collider edges and the feet plane at every platform size',()=>{
  for(const [sheet,surfaces] of Object.entries(metadata._surfaces))for(const [index,surface] of Object.entries(surfaces)) {
    const frame=metadata[sheet][index],[, ,w,h]=frame,[left,top,right]=surface;
    for(const width of [98,138,198,440])for(const position of [{x:100,y:0},{x:380,y:1175},{x:238.25,y:1688.5}]) {
      const platform={...position,w:width},art=platformArtwork(platform,frame,surface);
      const paintedLeft=art.x-art.width/2+left/w*art.width;
      const paintedRight=art.x-art.width/2+right/w*art.width;
      const paintedY=art.y+art.height-top/h*art.height;
      assert(Math.abs(paintedLeft-(platform.x-width/2))<1e-9,`${sheet}:${index} left edge`);
      assert(Math.abs(paintedRight-(platform.x+width/2))<1e-9,`${sheet}:${index} right edge`);
      assert(Math.abs(paintedY-platform.y)<1e-9,`${sheet}:${index} landing height`);
    }
  }
});

function fixture(width=390,height=844) {
  const operations=[];
  const context=new Proxy({}, {get(target,key){
    if(key in target)return target[key];
    if(key==='measureText')return text=>({width:text.length*7});
    if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop(){}});
    return (...args)=>operations.push({method:key,args});
  }});
  const canvas={getContext:()=>context},assets={rects:{},surfaces:{}};
  for(const [key,file] of Object.entries(ATLAS_FILES)){
    assets[key]={name:key};assets.rects[key]=metadata[file];
    if(metadata._surfaces[file])assets.surfaces[key]=metadata._surfaces[file];
  }
  const previousWindow=globalThis.window;
  globalThis.window={innerWidth:width,innerHeight:height,devicePixelRatio:2};
  let renderer;
  try{renderer=new Renderer(canvas,assets,{reducedMotion:true});}finally{globalThis.window=previousWindow;}
  return {renderer,operations};
}

test('checkpoint pop-ups and route text draw after all scenery and stay inside the phone play area',()=>{
  for(const [width,height] of [[320,568],[390,844],[844,390]]) {
    const {renderer,operations}=fixture(width,height),game=new Expedition({index:2,character:'pip'});
    const checkpoint=game.level.platforms.find(platform=>platform.type==='checkpoint');
    Object.assign(game.player,{x:checkpoint.x,y:checkpoint.y});game.checkpoint=checkpoint.id;
    renderer.reset(game);renderer.handle({type:'checkpoint',x:checkpoint.x,y:checkpoint.y,id:checkpoint.id},game);
    renderer.settings.reducedMotion=false;renderer.flash=.2;renderer.draw(game,1/60);
    const lastImage=operations.findLastIndex(item=>item.method==='drawImage');
    const firstText=operations.findIndex(item=>item.method==='fillText');
    assert(firstText>lastImage,'No terrain, marker, creature, or player can paint over a label');
    assert(firstText>operations.findLastIndex(item=>item.method==='fillRect'),'Labels also stay in front of flashes');
    assert(operations.some(item=>item.method==='fillText'&&item.args[0]==='✓ Saved!'));
    for(const {args:[left,top,w,h]} of operations.filter(item=>item.method==='roundRect')) {
      assert(left>=12&&left+w<=width-12);assert(top>=Math.min(100,renderer.bottom-60));
      assert(top+h<=renderer.bottom-8,'Callouts stay above touch controls');
    }
  }
});

test('marker messages are brief, replace repeats, and freeze when the game is paused',()=>{
  const {renderer}=fixture(),game=new Expedition({index:3,character:'bop'});
  const fuel=game.level.platforms.find(platform=>platform.type==='refuel');
  Object.assign(game.player,{x:fuel.x,y:fuel.y,groundId:fuel.id});renderer.reset(game);
  for(let i=0;i<8;i++)renderer.handle({type:'refuel',x:fuel.x,y:fuel.y},game);
  assert.equal(renderer.callouts.length,1);assert.equal(renderer.callouts[0].text,'✓ Ready!');
  const life=renderer.callouts[0].life;renderer.draw(game,0);assert.equal(renderer.callouts[0].life,life);
  renderer.draw(game,life+.01);assert.equal(renderer.callouts.length,0);
  renderer.handle({type:'goalLocked',missing:4},game);assert.equal(renderer.callouts[0].text,'Find 4 more!');
  renderer.reset(game);assert.equal(renderer.callouts.length,0);
});
