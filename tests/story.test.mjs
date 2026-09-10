import test from 'node:test';
import assert from 'node:assert/strict';
import { JOURNEYS, journeyFor } from '../src/game/story.js';
import { Expedition } from '../src/game/engine.js';
import { makeLevel } from '../src/game/levels.js';
import { SaveStore, progressFor, validateSave } from '../src/game/storage.js';

test('18 chapters have distinct scenes, terrain, landmarks, introductions, and endings',()=>{
  const titles=new Set(),scenes=new Set(),terrain=new Set(),landmarks=new Set(),intros=new Set(),endings=new Set();
  for(const world of Object.values(JOURNEYS)) {
    assert.equal(world.chapters.length,6);
    for(let index=0;index<6;index++) {
      const level=makeLevel(index,false,world.id),chapter=world.chapters[index];
      assert.equal(level.world.id,world.id);assert.equal(level.mission.name,chapter.title);
      titles.add(chapter.title);scenes.add(`${world.sceneSheet}:${index}`);
      terrain.add(`${world.sheet}:${index}`);landmarks.add(`${world.sheet}:${6+index}`);
      intros.add(chapter.intro);endings.add(chapter.ending);
    }
  }
  for(const values of [titles,scenes,terrain,landmarks,intros,endings])assert.equal(values.size,18);
});

test('legacy shared progress migrates once into Nova, with the exact checkpoint and earned records',()=>{
  const oldGame=new Expedition({index:2,character:'pip',assist:true});
  oldGame.checkpoint=6;oldGame.collected.add('c1-0');oldGame.elapsed=32;oldGame.health=4;
  let stored=JSON.stringify({version:1,character:'pip',unlocked:4,missions:[{stars:3,bestScore:9800,bestTime:20,relics:3}],activeRun:oldGame.snapshot(),endlessBest:12000,tutorialSeen:true,settings:{music:false,assist:true}});
  const storage={getItem:()=>stored,setItem:(_key,value)=>{stored=value;}};
  const save=new SaveStore(storage);
  assert(save.migrated);assert.equal(save.data.version,3);assert.equal(save.data.character,'nova');
  assert.equal(save.data.unlocked,4);assert.equal(save.data.missions[0].bestScore,9800);
  assert.equal(save.data.missions[0].relics,3);assert.equal(save.data.activeRun.character,'nova');
  const continued=new Expedition({index:2,snapshot:save.data.activeRun});
  assert.equal(continued.player.y,continued.platform(6).y);assert.equal(continued.crystals,1);
  assert.equal(continued.elapsed,32);assert.equal(continued.health,4);assert(continued.assist);
  assert.equal(save.data.endlessBest,12000);assert(save.data.tutorialSeen);assert.equal(save.data.settings.music,false);
  for(const id of ['pip','bop']){assert.equal(progressFor(save.data,id).unlocked,0);assert.equal(progressFor(save.data,id).activeRun,null);}
  assert.equal(JSON.parse(stored).version,3);assert.equal(new SaveStore(storage).migrated,false);
});

test('finishing a chapter awards only its own world while preserving other adventures',()=>{
  let stored=null;const storage={getItem:()=>stored,setItem:(_key,value)=>{stored=value;}};
  const save=new SaveStore(storage),nova=new Expedition({character:'nova'});
  nova.elapsed=13;save.setRun(nova.snapshot());
  const pip=new Expedition({character:'pip'});pip.elapsed=22;pip.finish(true);save.complete(pip.result);
  assert.equal(progressFor(save.data,'pip').unlocked,1);assert(progressFor(save.data,'pip').missions[0].stars>0);
  assert.equal(progressFor(save.data,'nova').unlocked,0);assert.equal(progressFor(save.data,'bop').unlocked,0);
  assert.equal(progressFor(save.data,'nova').missions[0].stars,0);assert.deepEqual(progressFor(save.data,'nova').activeRun,nova.snapshot());
  for(const mission of progressFor(save.data,'nova').missions)mission.stars=1;
  save.chooseCharacter('pip');save.setRun(new Expedition({character:'pip',index:1}).snapshot());
  const timed=new Expedition({character:'bop',mode:'endless'});timed.maxHeight=400;timed.finish(true);save.complete(timed.result);
  const restored=new SaveStore(storage);
  assert.equal(restored.data.character,'pip');assert.equal(restored.data.activeRun.index,1);assert.equal(restored.data.endlessBest,timed.result.score);
  assert.equal(progressFor(restored.data,'nova').activeRun.elapsed,13);
  assert.equal(JSON.parse(stored).unlocked,undefined,'Serialized progress has one authoritative record per world');
});

test('cross-world, locked-chapter, and incompatible checkpoint snapshots cannot resume',()=>{
  const save=new SaveStore({getItem:()=>null,setItem:()=>{}});
  progressFor(save.data,'pip').activeRun=new Expedition({character:'bop'}).snapshot();
  progressFor(save.data,'bop').activeRun=new Expedition({character:'bop',index:5}).snapshot();
  progressFor(save.data,'nova').activeRun={...new Expedition().snapshot(),revision:-1};
  const restored=validateSave(JSON.parse(JSON.stringify(save.data)));
  for(const id of ['nova','pip','bop'])assert.equal(progressFor(restored,id).activeRun,null);
  assert.equal(journeyFor('unknown').id,'nova');
});

test('previous separate stories keep earned records, migrate Nova checkpoints, and teach new abilities',()=>{
  const seed=new SaveStore({getItem:()=>null,setItem:()=>{}}).data;
  seed.version=2;seed.character='bop';seed.tutorialSeen=true;
  seed.journeys.nova.activeRun={...new Expedition().snapshot(),revision:2,elapsed:21,collected:['c1-0']};
  seed.journeys.pip.missions[0]={stars:3,bestScore:9400,bestTime:19,relics:3};
  seed.journeys.pip.activeRun={...new Expedition({character:'pip'}).snapshot(),revision:2};
  const save=validateSave(seed);
  assert.equal(save.character,'nova');assert.equal(save.activeRun.revision,3);assert.equal(save.activeRun.elapsed,21);
  assert.deepEqual(save.activeRun.collected,['c1-0']);assert.equal(save.journeys.pip.activeRun,null);
  assert.equal(save.journeys.pip.missions[0].bestScore,9400);assert.equal(save.abilityGuides.nova,true);assert.equal(save.abilityGuides.pip,false);assert.equal(save.abilityGuides.bop,false);
});

test('story routes preserve platform bounds, deterministic pickups, and chapter mechanics',()=>{
  for(const id of ['nova','pip','bop'])for(let index=0;index<6;index++) {
    const level=makeLevel(index,false,id),original=makeLevel(index);
    assert.equal(level.gravity,original.gravity);assert.equal(level.goal.required,original.goal.required);
    assert.deepEqual(level.collectibles.map(item=>item.id),makeLevel(index,false,id).collectibles.map(item=>item.id));
    assert.equal(level.collectibles.filter(item=>item.type==='relic').length,3);
    for(const platform of level.platforms) {
      assert(platform.x-Math.abs(platform.amplitude)-platform.w/2>=0);
      assert(platform.x+Math.abs(platform.amplitude)+platform.w/2<=480);
    }
    for(const item of level.collectibles)assert(item.x>0&&item.x<480);
  }
});
