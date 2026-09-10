import { MISSIONS, STEP } from './levels.js';
import { Expedition } from './engine.js';
import { SaveStore, progressFor, nextFriend, characterUnlocked } from './storage.js';
import { Soundscape } from './audio.js';
import { Controls } from './input.js';
import { Renderer, loadAssets } from './renderer.js';

import { assetUrl, ATLAS_FILES } from './assets.js';
import { characterFor } from './characters.js';
import { journeyFor } from './story.js';
import { homeMarkup, howToMarkup, pauseMarkup, resultMarkup } from './menu.js';
import { createLifecycle } from './lifecycle.js';

export function mountGame(root) {
  const lifetime = createLifecycle();
  const $ = selector => root.querySelector(selector);
  const home = $('#home'), canvas = $('#game'), hud = $('#hud'), controlsElement = $('#controls'), modal = $('#modal');
  const icons = {
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>', left: '<path d="m14 6-6 6 6 6"/>', right: '<path d="m10 6 6 6-6 6"/>', up: '<path d="M12 19V5m-6 6 6-6 6 6"/>',
    sound: '<path d="m11 5-6 4H2v6h3l6 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>', mute: '<path d="m11 5-6 4H2v6h3l6 4V5Zm5 4 5 6m0-6-5 6"/>',
    settings: '<path d="M4 7h16M4 17h16M8 4v6m8 4v6"/>', pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="m8 5 11 7-11 7V5Z"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>', help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4m0 3v.1"/>',
    crystal: '<path d="m12 2 7 8-7 12-7-12 7-8Zm0 0v20M5 10h14"/>', star: '<path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1.1 6.1-5.6-2.9L6.4 20l1.1-6.1L3 9.5l6.2-.9L12 3Z"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
    endless: '<path d="M12 12c-2-3-3-5-6-5a5 5 0 0 0 0 10c3 0 4-2 6-5Zm0 0c2-3 3-5 6-5a5 5 0 0 1 0 10c-3 0-4-2-6-5Z"/>',
    boost: '<path d="m13 2-8 12h6l-1 8 9-13h-6l0-7Z"/>', check: '<path d="m5 12 4 4L19 6"/>', home: '<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
    tail: '<path d="m8 8 4-5 4 5M12 3v11c0 8-10 8-10 2a4 4 0 0 1 8 0"/>', hook: '<path d="M14 3v12a6 6 0 0 1-12 0v-3l4 3M11 3h6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', retry: '<path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/>',
    fullscreen: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  };
  const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
  const stars = count => Array.from({length:3},(_,i)=>icon('star',i<count?'earned':'unearned')).join('');
  const time = seconds => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2,'0')}`;
  const format = number => Math.floor(number).toLocaleString('en');
  const store = new SaveStore();const settings = store.data.settings;const audio = new Soundscape(settings);
  let assets, renderer, game = null, selected = store.data.activeRun?.index ?? store.restartedIndex ?? store.data.unlocked, lastFrame = 0, accumulator = 0, hudAt = 0, saveAt = 0, dialogKind = '', tutorialAction = null, toastTimer, tipTimer, installPrompt = null;
  const controls = new Controls(controlsElement, () => pauseGame());
  let booting = false;
  home.hidden=false;canvas.hidden=true;hud.hidden=true;controlsElement.hidden=true;
  $('#loading').hidden=false;$('#loading-progress').value=0;$('#game-tip').hidden=true;$('#toast').hidden=true;
  if(modal.open)modal.close();

  function announce(text) { $('#announcement').textContent = text; }
  function toast(text) { clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,3500); }
  function tip(text, duration = 4500) { clearTimeout(tipTimer);$('#game-tip').textContent=text;$('#game-tip').hidden=false;tipTimer=setTimeout(()=>$('#game-tip').hidden=true,duration); }
  function persist() { if(!store.write()) toast('Progress could not be saved. Keep this tab open to keep your session.'); }
  function saveRun() { if(game?.mode==='campaign'&&game.state!=='ended') {if(!store.setRun(game.snapshot())) toast('Progress could not be saved on this device.');} }
  function applySettings() {
    document.documentElement.classList.toggle('reduced-motion',settings.reducedMotion);
    controlsElement.classList.toggle('left-handed',settings.leftHanded);
    audio.applySettings();
    audio.boost(false);
  }
  applySettings();

  function renderHome() {
    selected=Math.min(selected,store.data.unlocked);
    home.classList.add('kid-home');document.body.classList.add('friendly-menu');
    home.innerHTML=homeMarkup({missions:MISSIONS,selected,data:store.data,installable:!!installPrompt,art:spriteArt,icon,stars});
    const world=journeyFor(store.data.character);
    $('.world-backdrop').innerHTML=spriteArt(world.sceneSheet,selected,'xMidYMid slice');
    document.documentElement.style.setProperty('--accent',world.chapters[selected].color);
  }

  // A cropped window into real raster artwork; natural sizes support every atlas.
  function spriteArt(sheet,index,aspect='xMidYMid meet') {
    const rect=assets.rects[sheet][index], image=assets[sheet];
    return `<svg class="menu-sprite" viewBox="${rect.join(' ')}" preserveAspectRatio="${aspect}" aria-hidden="true" focusable="false"><image href="${assetUrl(ATLAS_FILES[sheet]+'.webp')}" width="${image.naturalWidth}" height="${image.naturalHeight}" /></svg>`;
  }

  function openDialog(kind, content) {
    dialogKind=kind;modal.innerHTML=content;
    modal.classList.add('friendly-dialog');
    modal.dataset.kind=kind;
    if(!modal.open) modal.showModal();
    lifetime.request(()=>modal.querySelector('[autofocus],.primary,button,input')?.focus());
  }
  function closeDialog() {if(modal.open)modal.close();dialogKind='';}
  function cancelTutorial(){tutorialAction=null;if(game?.state==='ended')goHome();else{closeDialog();$('.start-button')?.focus({preventScroll:true});}}
  function dialogHead(eyebrow,title,close='close-secondary') {return `<button class="icon-button dialog-close" data-action="${close}" aria-label="Close">${icon('close')}</button>${eyebrow?`<div class="eyebrow">${eyebrow}</div>`:''}<h2 id="dialog-title">${title}</h2>`;}
  function showHowTo(launch = null) {
    tutorialAction=launch;
    const character=game?.state==='paused'?game.character:store.data.character;
    openDialog(launch?'tutorial':'howto',howToMarkup({sheet:characterFor(character).sheet,world:journeyFor(character),art:spriteArt,icon,head:dialogHead,launch}));
  }
  function showSettings() {
    if(game?.state==='playing')pauseGame();
    const row=(key,label,desc='')=>`<label class="setting-row"><span><strong>${label}</strong>${desc?`<small>${desc}</small>`:''}</span><input type="checkbox" name="${key}" ${settings[key]?'checked':''}><span class="switch" aria-hidden="true"></span></label>`;
    openDialog('settings',`${dialogHead('','Your way')}
      <div class="settings-list">${row('assist','Extra help','More shields. Gentler creatures. New games.')}${row('music','Music')}${row('effects','Sounds')}${row('haptics','Little vibrations')}${row('reducedMotion','Calmer screen')}${row('leftHanded','Swap the buttons')}</div>
      <button class="primary wide" data-action="close-secondary">Done ${icon('check')}</button><button class="text-button centered" data-action="about">About the game</button>`);
  }
  function closeSecondary() {closeDialog();if(game?.state==='paused')showPause();else if(!game)renderHome();}
  function requestRun(mode='campaign',fresh=false) {
    const snapshot=!fresh&&mode==='campaign'&&store.data.activeRun?.index===selected?store.data.activeRun:null;
    const launch=()=>startRun(selected,mode,snapshot);
    if(!store.data.abilityGuides[store.data.character])showHowTo(launch);else launch();
  }
  function startRun(index,mode='campaign',snapshot=null,character=store.data.character) {
    closeDialog();store.chooseCharacter(character);selected=index;
    game=new Expedition({index,mode,assist:settings.assist,character:store.data.character,snapshot});renderer.reset(game);controls.clear();controls.active=true;
    audio.setChapter(game.character,index,game.elapsed);audio.unlock();audio.setActive(true);
    home.hidden=true;canvas.hidden=false;hud.hidden=false;controlsElement.hidden=false;document.body.classList.add('in-game');
    document.body.classList.remove('friendly-menu');document.documentElement.style.setProperty('--accent',game.level.mission.color);
    renderHUD();renderControls();applySettings();accumulator=0;lastFrame=performance.now();saveAt=game.elapsed+5;
    canvas.tabIndex=-1;canvas.focus({preventScroll:true});
    if(mode==='campaign')store.setRun(game.snapshot());
    if(snapshot)tip(`Back at your checkpoint. Your adventure continues!`);
    else if(mode==='endless')tip(`Two minutes. Collect ${game.level.world.tokens} and climb high!`,5500);
    else tip(game.level.chapter.intro,4800);
    announce(`${mode==='endless'?'Two minute climb':game.level.mission.name}. ${game.level.world.name}.`);
  }
  function renderHUD() {
    const world=game.level.world;
    hud.innerHTML=`<div class="hud-top"><div class="hud-mission"><span class="eyebrow">${game.mode==='endless'?'Two minute climb':world.name}</span><strong>${game.mode==='endless'?world.name:game.level.mission.name}</strong><div id="health" class="health" aria-label="Shields"></div></div><div class="hud-counters"><div class="counter token-counter"><span class="hud-token" aria-hidden="true">${spriteArt(world.sheet,12)}</span><strong id="crystals">0</strong><span id="crystal-target">/ ${game.mode==='endless'?'∞':game.level.goal.required}</span></div><div class="counter altitude">${icon(game.mode==='endless'?'endless':'up')}<strong id="altitude">0</strong><span>${game.mode==='endless'?'LEFT':'M'}</span></div></div><div class="hud-actions"><button class="icon-button" data-action="pause" aria-label="Pause game">${icon('pause')}</button></div></div>
      <div class="ascent-meter" aria-label="Ascent progress"><span>${icon('star')}</span><div><i id="ascent-fill"></i></div><span id="ascent-percent">0%</span></div><div class="hud-bottom"><span id="relics">0 / 3 RELICS</span><span id="score">0 PTS</span></div>`;
    updateHUD();
  }
  function renderControls() {
    const friend=characterFor(game.character);
    controlsElement.innerHTML=`<div class="move-controls"><button class="move-button" data-control="left" aria-label="Move left">${icon('left')}</button><button class="move-button" data-control="right" aria-label="Move right">${icon('right')}</button></div><div class="desktop-hint"><span><kbd>A</kbd> <kbd>D</kbd> Move</span><span><kbd>SPACE</kbd> Jump ×2</span><span><kbd>SHIFT</kbd> ${friend.abilityName}</span></div><div class="action-controls"><div class="boost-group"><button class="boost-button" data-control="boost" aria-label="${friend.guide}: ${friend.abilityName}">${icon(friend.icon)}</button><div class="fuel-track" role="progressbar" aria-label="${friend.meter}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><i id="fuel-fill"></i></div><span>${friend.action}</span></div><div class="jump-group"><button class="jump-button" data-control="jump" aria-label="Jump. Tap twice for double jump.">${icon('up')}</button><span>JUMP ×2</span></div></div>`;
  }
  function updateHUD() {
    if(!game)return;
    const hp=$('#health');if(hp){hp.innerHTML=Array.from({length:game.maxHealth},(_,i)=>icon('shield',i<game.health?'full':'empty')).join('');hp.setAttribute('aria-label',`${game.health} of ${game.maxHealth} shields`);}
    $('#crystals').textContent=game.crystals;
    $('.token-counter').setAttribute('aria-label',`${game.crystals} ${game.level.world.tokens}${game.mode==='campaign'?` of ${game.level.goal.required}`:''}`);
    $('#altitude').textContent=game.mode==='endless'?time(Math.max(0,120-game.elapsed)):format(game.maxHeight);
    $('#score').textContent=`${format(game.score)} PTS`;
    $('#relics').textContent=game.mode==='endless'?`BEST ${format(store.data.endlessBest)}`:`${game.relics} / 3 ${game.level.world.relics}`;
    const percent=Math.min(100,Math.floor(game.maxHeight/game.level.height*100));$('#ascent-fill').style.height=`${percent}%`;$('#ascent-percent').textContent=`${percent}%`;
    const fuel=$('#fuel-fill');if(fuel){fuel.style.width=`${game.player.fuel}%`;fuel.parentElement.setAttribute('aria-valuenow',Math.round(game.player.fuel));fuel.parentElement.classList.toggle('low',game.player.fuel<20);}
  }
  function pauseGame(automatic=false) {
    if(!game||game.state!=='playing')return;
    game.state='paused';controls.active=false;controls.clear();audio.setActive(false);saveRun();$('#game-tip').hidden=true;
    showPause(automatic);announce('Game paused.');
  }
  function showPause() {
    openDialog('pause',pauseMarkup({sheet:characterFor(game.character).sheet,art:spriteArt,icon,head:dialogHead}));
  }
  function resumeGame() {if(!game||game.state!=='paused')return;closeDialog();controls.clear();controls.active=true;game.state='playing';lastFrame=performance.now();accumulator=0;audio.unlock();audio.setActive(true);canvas.focus({preventScroll:true});}
  function goHome() {
    saveRun();closeDialog();controls.active=false;controls.clear();audio.setActive(false);game=null;
    home.hidden=false;canvas.hidden=true;hud.hidden=true;controlsElement.hidden=true;$('#game-tip').hidden=true;document.body.classList.remove('in-game');renderHome();$('.start-button').focus({preventScroll:true});
  }
  function finish(result) {
    controls.active=false;controls.clear();audio.setActive(false);audio.fx(result.won?'win':'lose');$('#game-tip').hidden=true;
    const oldBest=result.mode==='endless'?store.data.endlessBest:progressFor(store.data,result.character).missions[result.index].bestScore;
    if(!store.complete(result))toast('This result could not be saved on this device.');
    if(store.data.character!==game.character)selected=store.data.activeRun?.index??store.data.unlocked;
    openDialog('result',resultMarkup({result,oldBest,mission:game.level.mission,sheet:characterFor(game.character).sheet,art:spriteArt,icon,head:dialogHead,format,time}));
    announce(`${result.won?'You did it!':'Another go?'} ${result.stars} stars. ${result.crystals} ${game.level.world.tokens} collected. Score ${result.score}.`);
  }

  function handleEvents(events) {
    for(const event of events) {
      renderer.handle(event,game);
      if(['jump','double','tail','hook','crystal','relic','checkpoint','shield','hurt'].includes(event.type))audio.fx(event.type);
      if(event.type==='bonk')audio.fx('double');
      if(event.type==='checkpoint'){saveRun();announce(`Checkpoint saved. ${characterFor(game.character).abilityName} ready.`);}
      if(event.type==='refuel'){audio.fx('shield');announce(`${characterFor(game.character).abilityName} ready.`);}
      if(event.type==='relic')tip(`${game.relics} of 3 ${game.level.world.relics}!`,2400);
      if(event.type==='shield')tip('Shield restored.',2000);
      if(event.type==='respawn'){renderer.reset(game);tip(`${game.health} shield${game.health===1?'':'s'} left. Back at your checkpoint.`,3000);}
      if(event.type==='goalLocked')announce(`Find ${event.missing} more ${event.missing===1?game.level.world.token:game.level.world.tokens}. Follow the trail below!`);
      if(settings.haptics&&navigator.vibrate&&['hurt','checkpoint','relic'].includes(event.type))navigator.vibrate(event.type==='hurt'?[25,30,25]:15);
      if(event.type==='finish')finish(event.result);
    }
  }
  function frame(now) {
    const dt=Math.min((now-(lastFrame||now))/1000,.1);lastFrame=now;
    if(game&&renderer){
      if(game.state==='playing') {
        accumulator+=dt;
        while(accumulator>=STEP&&game.state==='playing'){game.step(STEP,controls.read());handleEvents(game.drainEvents());accumulator-=STEP;}
        audio.update();audio.boost(game.character==='nova'&&game.player.boosting);
        if(now-hudAt>85){updateHUD();hudAt=now;}
        if(game.elapsed>=saveAt){saveRun();saveAt=game.elapsed+5;}
      }
      renderer.draw(game,game.state==='playing'?dt:0);
    }
    lifetime.request(frame);
  }

  lifetime.listen(root,'click',event=>{
    const button=event.target.closest('[data-action]');if(!button||button.disabled)return;
    const action=button.dataset.action;if(!['pause','resume'].includes(action))audio.fx('click');
    if(action==='select'){selected=Number(button.dataset.index);renderHome();home.querySelector(`[data-index="${selected}"]`)?.focus({preventScroll:true});}
    if(action==='character'){const friend=characterFor(button.dataset.character);if(!store.chooseCharacter(friend.id))toast('Your choice could not be saved on this device.');selected=store.data.activeRun?.index??store.data.unlocked;renderHome();home.querySelector(`[data-character="${friend.id}"]`)?.focus({preventScroll:true});announce(`${friend.name}. ${journeyFor(friend.id).name}.`);}
    if(action==='assist'){settings.assist=!settings.assist;persist();renderHome();home.querySelector('[data-action="assist"]')?.focus({preventScroll:true});toast(`Extra help ${settings.assist?'on':'off'}`);announce(`Extra help ${settings.assist?'on':'off'} for new games.`);}
    if(action==='play')requestRun();
    if(action==='endless')requestRun('endless',true);
    if(action==='new')openDialog('new',`${dialogHead('','Start again?')}<p class="dialog-description">Back to the beginning. Your stars stay!</p><button class="primary wide" data-action="confirm-new">Start over ${icon('arrow')}</button><button class="text-button centered" data-action="close-secondary">Keep my place</button>`);
    if(action==='confirm-new')requestRun('campaign',true);
    if(action==='launch'){store.data.tutorialSeen=true;store.data.abilityGuides[store.data.character]=true;persist();const launch=tutorialAction;tutorialAction=null;closeDialog();launch?.();}
    if(action==='cancel-tutorial')cancelTutorial();
    if(action==='howto')showHowTo();
    if(action==='settings')showSettings();
    if(action==='close-secondary')closeSecondary();
    if(action==='pause')pauseGame();
    if(action==='resume')resumeGame();
    if(action==='home'||action==='quit')goHome();
    if(action==='retry')startRun(game.index,game.mode,null,game.character);
    if(action==='handoff'){const next=nextFriend(game.character);if(next&&characterUnlocked(store.data,next.id)){store.chooseCharacter(next.id);selected=store.data.activeRun?.index??store.data.unlocked;requestRun();}}
    if(action==='next'){selected=Math.min(5,game.index+1);startRun(selected);}
    if(action==='sound'){const enable=!(settings.music||settings.effects);settings.music=enable;settings.effects=enable;if(enable)audio.unlock();audio.applySettings();persist();renderHome();home.querySelector('[data-action="sound"]')?.focus({preventScroll:true});}
    if(action==='install'&&installPrompt){const prompt=installPrompt;installPrompt=null;void prompt.prompt().then(()=>prompt.userChoice).catch(()=>{}).finally(()=>{if(!lifetime.disposed&&!game)renderHome();});}
    if(action==='about')openDialog('about',`${dialogHead('A GAME BY KONRAD PLAK','Galactic Jumpers.')}<p class="dialog-description">An orbital platform adventure about finding your feet, chasing starlight, and going a little further.</p><div class="about-detail"><strong>Three friends. One adventure.</strong><p>Start with Nova’s jetpack, spring through Pip’s forest with his tail, then hook through Bop’s city. Six chapters with each friend tell one story. Replay the chapters and friends you’ve unlocked. Earn extra stars by collecting 85% of the shiny things and beating the target time.</p><strong>Your pocket-sized universe.</strong><p>Play with touch or a keyboard. Add the game to your Home Screen from your browser menu. Progress is saved on this device; clearing browser data removes it.</p><strong>Artwork & sound</strong><p>Original artwork created with AI and adapted into game sprites. Music and effects are composed and synthesized in the game.</p></div><button class="primary wide" data-action="close-secondary">Back to the stars ${icon('arrow')}</button>`);
  });
  lifetime.listen(modal,'change',event=>{const name=event.target.name;if(Object.hasOwn(settings,name)){settings[name]=event.target.checked;applySettings();persist();if(settings.music||settings.effects)audio.unlock();}});
  lifetime.listen(modal,'cancel',event=>{event.preventDefault();if(dialogKind==='pause')resumeGame();else if(dialogKind==='result')goHome();else if(dialogKind==='tutorial')cancelTutorial();else closeSecondary();});
  lifetime.listen(document,'visibilitychange',()=>{if(document.hidden)pauseGame(true);});
  lifetime.listen(window,'blur',()=>pauseGame(true));
  lifetime.listen(window,'pagehide',()=>{saveRun();audio.setActive(false);});
  lifetime.listen(window,'resize',()=>renderer?.resize());
  lifetime.listen(window,'orientationchange',()=>{controls.clear();if(game?.state==='playing')pauseGame();});
  lifetime.listen(window,'beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;if(assets&&!game)renderHome();});

  async function boot() {
    if(booting||lifetime.disposed)return;
    booting=true;
    $('#retry-load').hidden=true;$('#loading-text').textContent='Getting your adventure ready…';
    try {
      const loaded=await loadAssets(count=>{if(!lifetime.disposed)$('#loading-progress').value=count;});
      if(lifetime.disposed)return;
      assets=loaded;renderer=new Renderer(canvas,assets,settings,id=>store.markSignSeen(id));renderer.setSeenSigns(Object.keys(store.data.signsSeen));renderHome();$('#loading').hidden=true;lifetime.request(frame);
      if(store.migrated){toast('Your earlier adventure is safe with Nova. Pip and Bop have new worlds!');store.migrated=false;}
      if(store.restartedIndex!==null){toast('New routes to explore! Your stars are safe. This world starts fresh.');store.restartedIndex=null;}
    } catch(error) {
      if(lifetime.disposed)return;
      $('#loading-text').textContent='The expedition couldn’t load. Check your connection and try again.';$('#retry-load').hidden=false;console.error(error);
    } finally {booting=false;}
  }
  lifetime.listen($('#retry-load'),'click',boot);
  void boot();
  return () => {
    if(lifetime.disposed)return;
    saveRun();
    lifetime.dispose();controls.destroy();audio.destroy();
    clearTimeout(toastTimer);clearTimeout(tipTimer);
    if(modal.open)modal.close();
    document.body.classList.remove('in-game','friendly-menu');
    document.documentElement.classList.remove('reduced-motion');
    document.documentElement.style.removeProperty('--accent');
  };
}
