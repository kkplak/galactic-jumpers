import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const config={cachePrefix:'galactic-jumpers-scope-',cacheName:'galactic-jumpers-scope-new',files:['/','/index.html','/assets/index-new.js'],legacyCaches:['galactic-jumpers-v1-1']};
const template=readFileSync(new URL('../src/service-worker.js',import.meta.url),'utf8');

test('offline worker installs fresh build files and retires only its own old caches',async()=>{
  const handlers={},added=[],removed=[];let claimed=false;
  const scope={self:{registration:{scope:'https://game.example/'},addEventListener:(name,fn)=>{handlers[name]=fn;},clients:{claim:()=>{claimed=true;}}},URL,Request,caches:{
    open:async()=>({addAll:async requests=>added.push(...requests)}),
    keys:async()=>['unrelated-app','galactic-jumpers-scope-old',config.cacheName,'galactic-jumpers-v1-1'],
    delete:async key=>removed.push(key),
  }};
  runInNewContext(template.replace('__OFFLINE_CONFIG__',JSON.stringify(config)),scope);
  let work;handlers.install({waitUntil:promise=>{work=promise;}});await work;
  assert.deepEqual(added.map(r=>r.url),config.files.map(path=>'https://game.example'+path));assert(added.every(r=>r.cache==='reload'));
  handlers.activate({waitUntil:promise=>{work=promise;}});await work;
  assert.deepEqual(removed,['galactic-jumpers-scope-old','galactic-jumpers-v1-1']);assert.equal(claimed,true);
});

test('offline navigation and hashed scripts use cache while unrelated requests pass through',async()=>{
  const handlers={};let network=0;
  runInNewContext(template.replace('__OFFLINE_CONFIG__',JSON.stringify(config)),{
    self:{registration:{scope:'https://game.example/'},addEventListener:(name,fn)=>{handlers[name]=fn;}},URL,Request,
    caches:{open:async()=>({match:async()=>new Response('cached game')})},fetch:()=>{network++;throw Error('offline');},
  });
  for(const url of ['https://game.example/?installed=1','https://game.example/assets/index-new.js']){
    let response;handlers.fetch({request:new Request(url),respondWith:promise=>{response=promise;}});
    assert.equal(await (await response).text(),'cached game');
  }
  for(const request of [new Request('https://game.example/account'),new Request('https://other.example/assets/index-new.js'),new Request('https://game.example/',{method:'POST'})]){
    handlers.fetch({request,respondWith:()=>assert.fail('The game must not intercept this request')});
  }
  assert.equal(network,0);
});
