import test from 'node:test';
import assert from 'node:assert/strict';
import { SCORES, musicFor, scoreEvents, INSTRUMENTS } from '../src/game/music.js';
import { Soundscape } from '../src/game/audio.js';

test('all 18 chapters have distinct, bounded original scores with changing arrangements',()=>{
  const titles=new Set(),scores=new Set();
  for(const [character,chapters] of Object.entries(SCORES))for(const [index,profile] of chapters.entries()){
    assert.equal(musicFor(character,index),profile);titles.add(profile.title);
    const events=Array.from({length:profile.beats*2*32},(_,step)=>scoreEvents(profile,step));
    scores.add(JSON.stringify(events));
    assert.notDeepEqual(events.slice(0,16),events.slice(profile.beats*2*16,profile.beats*2*16+16),'The quiet passage changes the arrangement');
    for(const note of events.flat()){
      assert(INSTRUMENTS[note.instrument]);assert(note.midi>=24&&note.midi<=105);
      assert(note.volume>0&&note.volume<=.11);assert(note.duration>0&&note.duration<6);assert(note.delay>=0&&note.delay<1);
    }
  }
  assert.equal(titles.size,18);assert.equal(scores.size,18);
  assert.equal(musicFor('unknown',99),SCORES.nova[0]);
});

class AudioMock {
  constructor(){this.currentTime=0;this.state='running';this.destination={};this.nodes=[];}
  param(){return {value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}};}
  createGain(){return {gain:this.param(),connect(){},disconnect(){}};}
  createOscillator(){const node={frequency:this.param(),connect(){},disconnect(){},start(time=0){this.startAt=time;},stop(time=0){this.stopAt=time;}};this.nodes.push(node);return node;}
  advance(seconds){this.currentTime+=seconds;for(const node of this.nodes)if(node.stopAt<=this.currentTime&&!node.ended){node.ended=true;node.onended?.();}}
  async close(){this.state='closed';}
}

async function fixture(run){
  const previous=globalThis.AudioContext;globalThis.AudioContext=AudioMock;
  const settings={music:true,effects:true},sound=new Soundscape(settings);
  try{await sound.unlock();await run(sound,settings);}finally{sound.destroy();globalThis.AudioContext=previous;}
}

test('music uses the audio clock, stays bounded after a stalled frame, and releases finished voices',async()=>{
  await fixture(sound=>{
    sound.setChapter('pip',1);sound.setActive(true);sound.update();
    assert.equal(sound.score.title,'Mushroom Hop');assert.equal(sound.note,1);
    assert(sound.ctx.nodes.every(node=>node.startAt>=.1));
    const count=sound.ctx.nodes.length;sound.update();assert.equal(sound.ctx.nodes.length,count);
    sound.ctx.advance(20);sound.update();assert.equal(sound.note,2,'A stall schedules one fresh step, not twenty seconds of notes');
    let maxVoices=0;
    for(let i=0;i<1200;i++){sound.ctx.advance(.05);sound.update();maxVoices=Math.max(maxVoices,sound.voices.size);}
    assert(maxVoices<100,'Polyphony stays suitable for mobile devices');
  });
});

test('pause, mute, chapter handoff and destroy cancel music without muting independent effects',async()=>{
  await fixture((sound,settings)=>{
    sound.setChapter('nova',2);sound.setActive(true);sound.update();sound.fx('tail');
    const step=sound.note;sound.setActive(false);
    assert([...sound.voices].every(voice=>voice.channel==='effects'));
    sound.ctx.advance(4);sound.update();assert.equal(sound.note,step);
    sound.setActive(true);sound.update();assert(sound.note>step);
    settings.music=false;sound.applySettings();assert(![...sound.voices].some(v=>v.channel==='music'));
    const nodes=sound.ctx.nodes.length;sound.ctx.advance(1);sound.update();assert.equal(sound.ctx.nodes.length,nodes);
    settings.music=true;sound.applySettings();sound.setChapter('bop',5);assert.equal(sound.note,0);sound.update();
    assert.equal(sound.score,SCORES.bop[5]);assert(sound.note>0);
    sound.destroy();assert.equal(sound.voices.size,0);assert.equal(sound.ctx,null);
  });
});
