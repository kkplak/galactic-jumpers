import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Expedition } from '../src/game/engine.js';
import { makeLevel, MISSIONS, STEP } from '../src/game/levels.js';
import { createEnemy, stepEnemy, enemyContact } from '../src/game/enemies.js';
import { CHARACTERS } from '../src/game/characters.js';
import { SaveStore, freshSave, validateSave, progressFor } from '../src/game/storage.js';
import { ATLAS_FILES } from '../src/game/assets.js';
import { homeMarkup, howToMarkup, pauseMarkup, resultMarkup } from '../src/game/menu.js';

const tick = (enemy, seconds, platforms, assist=false, playerY=enemy.baseY) => {
  for(let i=0;i<Math.round(seconds/STEP);i++)stepEnemy(enemy,STEP,playerY,platforms,assist);
};

test('all three friends keep consistent ordinary jumps, movement, and hitboxes',()=>{
  const games=CHARACTERS.map(({id})=>{
    const game=new Expedition({character:id});game.level.platforms=game.level.platforms.slice(0,1);game.level.collectibles=[];return game;
  });
  for(let frame=0;frame<600;frame++) {
    const input={jump:frame===0||frame===44||frame===480,right:frame<70,left:frame>170&&frame<240};
    games.forEach(game=>game.step(STEP,input));
    assert.deepEqual(games[1].player,games[0].player);assert.deepEqual(games[2].player,games[0].player);
  }
  assert.deepEqual(games.map(game=>game.character),['nova','pip','bop']);
});

test('switching story worlds keeps separate checkpoints and restores rewards, health, time, and assist mode',()=>{
  let stored=null;const storage={getItem:()=>stored,setItem:(_key,value)=>{stored=value;}};
  const save=new SaveStore(storage),game=new Expedition({index:2,assist:true,character:'pip'});
  for(const id of ['nova','pip'])for(const mission of progressFor(save.data,id).missions)mission.stars=1;
  save.chooseCharacter('pip');
  save.data.unlocked=2;game.checkpoint=6;game.collected.add('c1-0');game.elapsed=41;game.health=4;
  save.setRun(game.snapshot());const before={...save.data.activeRun};
  assert(save.chooseCharacter('bop'));
  assert.equal(save.data.activeRun,null);assert.equal(save.data.unlocked,0);
  const bop=new Expedition({character:'bop'});bop.elapsed=8;save.setRun(bop.snapshot());
  assert.deepEqual(progressFor(save.data,'pip').activeRun,before);
  const restored=new SaveStore(storage);restored.chooseCharacter('pip');
  const run=new Expedition({index:2,snapshot:restored.data.activeRun});
  assert.equal(restored.data.character,'pip');assert.equal(run.character,'pip');
  assert.equal(run.player.y,run.platform(6).y);assert.equal(run.crystals,1);assert.equal(run.health,4);assert.equal(run.elapsed,41);assert(run.assist);
  assert.deepEqual(progressFor(restored.data,'bop').activeRun,bop.snapshot());
});

test('old saves keep progression and invalid character names cannot become asset paths',()=>{
  const old={version:1,unlocked:4,missions:[{stars:3,bestScore:500}],settings:{assist:true}};
  const saved=validateSave(old);assert.equal(saved.character,'nova');assert.equal(saved.unlocked,4);assert.equal(saved.missions[0].stars,3);
  assert.equal(validateSave({...old,character:'../../elsewhere'}).character,'nova');
  assert.equal(new Expedition({character:'unknown'}).character,'nova');
});

test('campaign creature encounters are varied and preserve peaceful checkpoint and fuel pads',()=>{
  const types=new Set(),compositions=[];
  for(let index=0;index<6;index++) {
    const level=makeLevel(index);compositions.push(level.enemies.map(enemy=>enemy.type).join(','));
    for(const enemy of level.enemies) {
      types.add(enemy.type);assert(enemy.baseY>300,'No creature directly above the spawn');
      if(enemy.platformId!==undefined)assert(!['base','checkpoint','refuel'].includes(level.platforms[enemy.platformId].type));
    }
  }
  assert.equal(makeLevel(0).enemies.length,0);assert.equal(new Set(compositions).size,6);
  assert.deepEqual([...types].sort(),['crawler','drone','hopper','swooper']);
});

test('crawlers stay on their moving platform and disappear if its surface breaks',()=>{
  const platform={x:200,y:600,w:150,broken:false};
  const crawler=createEnemy('crawler',{platformId:0,baseY:617});
  for(let i=0;i<1200;i++) {
    platform.x=200+Math.sin(i*.02)*50;platform.y=600+i*.04;
    stepEnemy(crawler,STEP,platform.y,[platform]);
    assert(Math.abs(crawler.x-platform.x)<=platform.w/2-30+.001);
    assert.equal(crawler.y,platform.y+17);
  }
  platform.broken=true;stepEnemy(crawler,STEP,platform.y,[platform]);assert(crawler.hidden);
  platform.broken=false;stepEnemy(crawler,STEP,platform.y,[platform]);assert(!crawler.hidden);
});

test('hoppers crouch before a bounded hop and assist mode gives longer warning time',()=>{
  const platform={x:240,y:600,w:180},normal=createEnemy('hopper',{platformId:0,baseY:617}),gentle=createEnemy('hopper',{platformId:0,baseY:617});
  tick(normal,2,[platform]);assert(normal.warning);assert.equal(normal.y,617);
  tick(normal,.9,[platform]);assert.equal(normal.state,'hop');assert(normal.y>690&&normal.y<=707);
  tick(normal,.61,[platform]);assert.equal(normal.state,'idle');assert.equal(normal.y,617);
  tick(gentle,3.5,[platform],true);assert(gentle.warning);assert.equal(gentle.y,617);
});

test('swoopers warn on approach, commit to a fixed lane, rest, and warn before returning',()=>{
  const flyer=createEnemy('swooper',{baseY:1000});
  tick(flyer,9,[],false,0);assert.equal(flyer.age,0);assert.equal(flyer.x,48);
  tick(flyer,1,[],false,800);assert(flyer.warning);assert.equal(flyer.x,48);
  tick(flyer,.7,[],false,820);assert.equal(flyer.state,'dash');assert(flyer.x>48&&flyer.x<432);assert.equal(flyer.y,1000);
  tick(flyer,2,[],false,1100);assert.equal(flyer.state,'rest');assert.equal(flyer.x,432);
  tick(flyer,3,[],false,1000);assert(flyer.warning);assert.equal(flyer.facing,-1);assert.equal(flyer.x,432);
});

test('landing on a ground creature gives a bounce and four harmless seconds without repeat rewards',()=>{
  const game=new Expedition();game.level.platforms=game.level.platforms.slice(0,1);game.level.collectibles=[];
  const crawler=createEnemy('crawler',{platformId:0,baseY:17});game.level.enemies=[crawler];
  Object.assign(game.player,{x:240,y:35,vy:-240,grounded:false,groundId:-1,coyote:0,jumps:2});
  game.step(STEP,{});
  assert.equal(game.health,3);assert.equal(game.player.vy,385);assert.equal(game.player.jumps,1);assert.equal(crawler.stunned,4);
  assert.equal(game.drainEvents().filter(event=>event.type==='bonk').length,1);
  assert.equal(enemyContact(crawler,{x:crawler.x,y:0,w:24,h:40,vy:-20},35),null);
  tick(crawler,3.9,game.level.platforms);assert(crawler.stunned>0);
  tick(crawler,.11,game.level.platforms);assert.equal(crawler.stunned,0);
  assert.equal(enemyContact(crawler,{x:crawler.x,y:0,w:24,h:40,vy:0},0),'hurt');
  assert.equal(game.crystals,0);
});

test('side contact costs a single shield and flying creatures cannot be bounced on',()=>{
  const game=new Expedition();game.level.platforms=game.level.platforms.slice(0,1);game.level.collectibles=[];
  const crawler=createEnemy('crawler',{platformId:0,baseY:17});game.level.enemies=[crawler];
  game.step(STEP,{});assert.equal(game.health,2);assert(game.player.invulnerable>0);
  for(let i=0;i<30;i++)game.step(STEP,{});assert.equal(game.health,2);
  const drone=createEnemy('drone',{baseY:100});
  assert.equal(enemyContact(drone,{x:240,y:110,w:24,h:40,vy:-100},120),'hurt');
  assert.equal(enemyContact(drone,{x:300,y:110,w:24,h:40,vy:-100},120),null);
});

test('pausing freezes enemy warnings and recovery along with the player',()=>{
  const game=new Expedition({index:3});game.player.y=900;game.step(STEP,{});
  const before=structuredClone(game.level.enemies);game.state='paused';
  for(let i=0;i<120;i++)game.step(STEP,{});
  assert.deepEqual(game.level.enemies,before);
});

const sprites=JSON.parse(readFileSync(new URL('../public/assets/sprites.json',import.meta.url),'utf8'));
const art=(sheet,index)=>{assert(sprites[ATLAS_FILES[sheet]]?.[index],`Missing ${sheet}:${index}`);return `<span data-art="${sheet}:${index}"></span>`;};
const helpers={art,icon:name=>`<i data-icon="${name}"></i>`,head:(_eyebrow,title)=>`<h2>${title}</h2>`,format:String,time:String,stars:count=>String(count)};

test('illustrated menus use valid art for every friend, world, and result without invalid next-world actions',()=>{
  for(const character of CHARACTERS)for(let index=0;index<6;index++) {
    const data=freshSave();data.character=character.id;data.unlocked=5;
    const home=homeMarkup({...helpers,missions:MISSIONS,selected:index,data,installable:true});
    assert(!home.includes('undefined'));assert.equal((home.match(/data-action="character"/g)||[]).length,3);
    assert(home.includes(`data-character="${character.id}" aria-pressed="true"`));
    const game=new Expedition({index,character:character.id});game.finish(true);
    const result=resultMarkup({...helpers,result:game.result,oldBest:0,mission:MISSIONS[index],sheet:character.sheet});
    assert.equal(result.includes('data-action="next"'),index<5);
    howToMarkup({...helpers,sheet:character.sheet,world:game.level.world,launch:null});pauseMarkup({...helpers,sheet:character.sheet});
  }
  for(const mode of ['campaign','endless']) {
    const game=new Expedition({mode});game.finish(mode==='endless');
    const result=resultMarkup({...helpers,result:game.result,oldBest:0,mission:MISSIONS[0],sheet:'bop'});
    assert(!result.includes('data-action="next"'));assert(result.includes('data-action="retry"'));
  }
  const data=freshSave();data.activeRun=new Expedition().snapshot();
  const home=homeMarkup({...helpers,missions:MISSIONS,selected:0,data});
  assert(home.includes('Continue'));assert.equal((home.match(/ disabled /g)||[]).length,7);
});
