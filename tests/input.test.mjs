import test from 'node:test';
import assert from 'node:assert/strict';
import { Controls } from '../src/game/input.js';

// Event sources, rather than a browser DOM: verifies the same input transitions
// received from keyboard, simultaneous fingers, cancellation, and focus loss.
function fixture() {
  const win=new EventTarget();globalThis.window=win;globalThis.HTMLElement=class {};
  const element=new EventTarget();
  const buttons=['left','right','jump','boost'].map(action=>({dataset:{control:action},setPointerCapture(){},classList:{toggle(){}}}));
  element.querySelectorAll=()=>buttons;let selected='left';element.closest=()=>buttons.find(b=>b.dataset.control===selected);
  const event=(target,name,data)=>{const e=new Event(name,{cancelable:true});for(const [key,value]of Object.entries(data))Object.defineProperty(e,key,{value});target.dispatchEvent(e);};
  let paused=0;const input=new Controls(element,()=>paused++);input.active=true;
  return {input,pointer(name,id,action){selected=action;event(element,name,{pointerId:id});},key(name,code,repeat=false){event(win,name,{code,repeat});},blur(){event(win,'blur',{});},get paused(){return paused;}};
}
test('two fingers can move and boost while a third triggers a jump',()=>{
  const f=fixture();f.pointer('pointerdown',1,'right');f.pointer('pointerdown',2,'boost');f.pointer('pointerdown',3,'jump');
  const input=f.input.read();assert.equal(input.right,true);assert.equal(input.boost,true);assert.equal(input.jump,true);
  assert.equal(f.input.read().jump,false);
  f.pointer('pointerup',3,'jump');assert.equal(f.input.read().jumpReleased,true);assert.equal(f.input.down('boost'),true);assert.equal(f.input.down('right'),true);f.input.destroy();
});
test('pointer cancellation and lost capture never leave a held action stuck',()=>{
  const f=fixture();f.pointer('pointerdown',11,'left');f.pointer('pointerdown',12,'boost');
  f.pointer('pointercancel',11,'left');f.pointer('lostpointercapture',12,'boost');assert.equal(f.input.down('left'),false);assert.equal(f.input.down('boost'),false);f.input.destroy();
});
test('releasing one of two sources for the same action preserves the other',()=>{
  const f=fixture();f.key('keydown','KeyD');f.pointer('pointerdown',2,'right');f.pointer('pointerup',2,'right');assert.equal(f.input.down('right'),true);
  f.key('keyup','KeyD');assert.equal(f.input.down('right'),false);f.input.destroy();
});
test('keyboard repeats do not double jump; blur clears controls; pause fires once',()=>{
  const f=fixture();f.key('keydown','Space');assert.equal(f.input.read().jump,true);f.key('keydown','Space',true);assert.equal(f.input.read().jump,false);
  f.key('keydown','KeyA');f.blur();assert.equal(f.input.down('left'),false);assert.equal(f.input.down('jump'),false);
  f.key('keydown','Escape');f.key('keydown','Escape',true);assert.equal(f.paused,1);f.input.destroy();
});
