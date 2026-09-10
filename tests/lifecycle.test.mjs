import test from 'node:test';
import assert from 'node:assert/strict';
import { createLifecycle } from '../src/game/lifecycle.js';
import { Soundscape } from '../src/game/audio.js';

test('React effect cleanup cancels the game loop, focus frames, and input subscriptions before remount',()=>{
  const frames=new Map();let id=0,oldCalls=0,newCalls=0;
  const scheduler={requestFrame:cb=>{frames.set(++id,cb);return id;},cancelFrame:id=>frames.delete(id)};
  const source=new EventTarget(),first=createLifecycle(scheduler);
  first.listen(source,'action',()=>oldCalls++);
  const loop=()=>{oldCalls++;first.request(loop);};
  first.request(loop);first.request(()=>oldCalls++);
  const staleCallbacks=[...frames.values()];
  first.dispose();first.dispose();assert.equal(frames.size,0);
  const second=createLifecycle(scheduler);second.listen(source,'action',()=>newCalls++);
  source.dispatchEvent(new Event('action'));for(const cb of staleCallbacks)cb(100);
  assert.equal(oldCalls,0);assert.equal(newCalls,1);assert.equal(first.request(loop),null);
  second.dispose();source.dispatchEvent(new Event('action'));assert.equal(newCalls,1);
});

test('unmounting closes the audio context and prevents late unlock from reopening it',async()=>{
  let closed=0;
  const audio=new Soundscape({music:true,effects:true});
  audio.ctx={state:'suspended',currentTime:0,close:async()=>{closed++;}};
  audio.music=audio.effects={gain:{setTargetAtTime(){}}};
  audio.destroy();await audio.unlock();audio.destroy();
  assert.equal(closed,1);assert.equal(audio.ctx,null);assert.equal(audio.active,false);
});
