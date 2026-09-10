import { CHARACTERS, characterFor } from './characters.js';
import { journeyFor } from './story.js';
import { characterUnlocked, nextFriend, worldFinished } from './storage.js';

// Pure view functions keep copy, tap targets, and artwork out of the simulation.
export function homeMarkup({ missions, selected, data, installable, art, icon, stars }) {
  const mission = missions[selected], record = data.missions[selected];
  const resume = data.activeRun?.index === selected, friend = characterFor(data.character);
  const sound = data.settings.music || data.settings.effects;
  const world=journeyFor(friend.id),chapter=world.chapters[selected];
  return `
    <header class="home-top">
      <h1 class="game-wordmark">Galactic<br><span>Jumpers</span></h1>
      <div class="top-actions">
        ${installable ? `<button class="menu-tool" data-action="install" aria-label="Install game">${icon('download')}</button>` : ''}
        <button class="menu-tool" data-action="sound" aria-label="${sound ? 'Turn sound off' : 'Turn sound on'}" aria-pressed="${sound}">${icon(sound ? 'sound' : 'mute')}</button>
        <button class="menu-tool" data-action="settings" aria-label="Game settings">${icon('settings')}</button>
      </div>
    </header>
    <div class="lobby">
      <div class="world-stage" aria-hidden="true">
        <div class="stage-island">${art(world.sheet, 6 + selected)}</div>
        <div class="stage-hero">${art(friend.sheet, 7)}</div>
        <div class="stage-spark quest-spark">${art(world.sheet, 22)}</div>
        <div class="stage-spark spark-two">${art(world.sheet, 12)}</div>
      </div>
      <section class="launch-panel" aria-label="Ready to play">
        <p class="journey-name">${world.name}</p><div class="world-heading"><h2>${chapter.title}</h2><span class="mission-stars" aria-label="${record.stars} of 3 stars">${stars(record.stars)}</span></div>
        <p class="journey-quest">${world.quest}</p><div class="picture-goal" aria-label="Collect ${mission.required} ${world.tokens}, then find the gate"><span>${art(world.sheet, 12)}</span><strong>${mission.required}</strong>${icon('arrow')}<span class="tiny-gate">${art(world.sheet, 15)}</span></div>
        <div class="friend-picker" role="group" aria-label="Our story: Nova, then Pip, then Bop">${CHARACTERS.map((character,i) => `
          <button class="friend-choice" data-action="character" data-character="${character.id}" aria-pressed="${character.id === friend.id}" ${characterUnlocked(data,character.id)?'':'disabled'} aria-label="${characterUnlocked(data,character.id)?`Play with ${character.name}`:`Finish ${CHARACTERS[i-1]?.name}’s story to meet ${character.name}`}" style="--friend-color:${character.color}">
            <span class="friend-art">${art(character.sheet, 0)}</span><span class="friend-world-badge">${art(journeyFor(character.id).sheet,22)}</span><strong>${character.name}</strong>
            <span class="friend-check">${icon(!characterUnlocked(data,character.id)?'lock':worldFinished(data,character.id)?'star':character.id===friend.id?'check':'arrow')}</span>
          </button>`).join('')}
        </div>
        <button class="primary start-button" data-action="play">${icon('play')}<span>${resume ? 'Continue' : 'Play!'}</span></button>
        <div class="little-actions">
          <button class="menu-tool" data-action="howto" aria-label="How to play">${icon('help')}</button>
          <button class="challenge-button" data-action="endless" aria-label="Play the two minute challenge">${icon('clock')}<span>2:00</span></button>
          ${resume ? `<button class="menu-tool" data-action="new" aria-label="Start this chapter over">${icon('retry')}</button>` : `<button class="menu-tool help-button" data-action="assist" aria-pressed="${data.settings.assist}" aria-label="Extra help for new games" title="Extra help">${icon('shield')}${data.settings.assist ? '<span class="on-dot"></span>' : ''}</button>`}
        </div>
      </section>
      <section class="world-picker" aria-label="Choose a chapter"><div class="world-tiles" role="group" aria-label="Chapters in ${world.name}">${missions.map((m, i) => {
        const locked = i > data.unlocked;
        return `<button class="world-tile ${i === selected ? 'selected' : ''}" data-action="select" data-index="${i}" ${locked ? 'disabled' : ''} aria-pressed="${i === selected}" aria-label="Chapter ${i + 1}: ${world.chapters[i].title}. ${locked ? `Finish chapter ${i} to unlock.` : `${data.missions[i].stars} of 3 stars.`}"><span class="world-tile-art">${art(world.sheet, 6 + i)}</span><span class="world-number">${locked ? icon('lock') : i + 1}</span></button>`;
      }).join('')}</div></section>
    </div>`;
}

export function howToMarkup({ sheet, world=journeyFor('nova'), art, icon, head, launch }) {
  const friend=characterFor(world.id);
  return `${head('', 'Let’s jump!', launch ? 'cancel-tutorial' : 'close-secondary')}
    <div class="picture-guide">
      <div><span class="guide-art">${art(sheet, 1)}</span><h3>Move</h3><span class="move-key">${icon('left')}${icon('right')}</span><small class="keyboard-only">A / D</small></div>
      <div><span class="guide-art">${art(sheet, 3)}</span><h3>Jump ×2</h3><span class="move-key">${icon('up')} ×2</span><small class="keyboard-only">Space</small></div>
      <div><span class="guide-art">${art(sheet, friend.id==='nova'?5:3)}</span><h3>${friend.id==='pip'?'Tail jump':friend.guide}</h3><span class="move-key">${icon(friend.icon)}</span><small class="keyboard-only">Shift</small></div>
    </div>
    <div class="picture-guide-goal" aria-label="Collect ${world.tokens} and reach the glowing gate"><span>${art(world.sheet, 12)}</span>${icon('arrow')}<span>${art(world.sheet, 15)}</span></div>
    <p class="guide-caption">${friend.instruction}</p>
    <div class="creature-guide" aria-label="Jump on crawlers and hoppers. Dodge flying enemies."><span>${art(world.sheet, 18)}</span><span>${art(world.sheet, 19)}</span><p>Hop on these two!</p><span>${art(world.sheet, 20)}</span><p>Dodge!</p></div>
    <button class="primary wide" data-action="${launch ? 'launch' : 'close-secondary'}">${icon('play')} ${launch ? 'Let’s go!' : 'Got it!'}</button>`;
}

export function pauseMarkup({ sheet, art, icon, head }) {
  return `${head('', 'Little break?', 'resume')}<div class="result-picture pause-picture"><span class="result-hero">${art(sheet, 6)}</span><span class="result-sticker">${art('friends', 14)}</span></div>
    <button class="primary wide" data-action="resume">${icon('play')} Continue</button>
    <div class="little-actions"><button class="menu-tool" data-action="quit" aria-label="Save and go home">${icon('home')}</button><button class="menu-tool" data-action="howto" aria-label="How to play">${icon('help')}</button><button class="menu-tool" data-action="settings" aria-label="Game settings">${icon('settings')}</button></div>`;
}

export function resultMarkup({ result, oldBest, mission, sheet, art, icon, head, format, time }) {
  const world=journeyFor(result.character),chapter=world.chapters[result.index];
  const endless = result.mode === 'endless', final = result.won && result.index === 5 && !endless;
  const next = result.won && !endless && !final;
  const handoff=final?nextFriend(world.id):null,finished=final&&world.id==='bop';
  const title = !result.won ? 'Another go?' : final ? (world.id==='pip'?'Hello, forest!':world.id==='bop'?'Hello, city!':'Home again!') : endless ? 'Nice climb!' : 'You did it!';
  return `${head('', finished?'Together, we did it!':title, 'home')}<div class="result-picture ${final?'finale-picture':''} ${finished?'friends-finale':''}">${finished?CHARACTERS.map(c=>`<span class="finale-friend">${art(c.sheet,7)}</span>`).join(''):`<span class="result-hero">${art(sheet, result.won ? 7 : 0)}</span><span class="result-sticker">${handoff?art(handoff.sheet,7):result.won&&!endless?art(world.sheet,final?23:22):art('friends',result.won?6:15)}</span>`}</div>
    ${result.won&&!endless?`<p class="story-line">${final?world.ending:chapter.ending}</p><div class="chapter-stitches" aria-label="Story chapter ${result.index+1} of 6">${[0,1,2,3,4,5].map(i=>`<i class="${i<=result.index?'done':''}"></i>`).join('')}</div>`:''}
    ${result.won && !endless ? `<div class="picture-stars" aria-label="${result.stars} of 3 stars">${[0,1,2].map(i => `<span class="${i < result.stars ? '' : 'not-yet'}">${art('friends', 6)}</span>`).join('')}</div>` : ''}
    <div class="pocket-loot"><span aria-label="${result.crystals} ${world.tokens}"><i>${art(world.sheet, 12)}</i><strong>${result.crystals}</strong></span><span aria-label="${endless ? `${result.height} meters climbed` : `${result.relics} ${world.relics}`}">${endless ? icon('up') : `<i>${art(world.sheet, 13)}</i>`}<strong>${endless ? format(result.height) : result.relics}</strong></span></div>
    <button class="primary wide" data-action="${next ? 'next' : handoff ? 'handoff' : finished?'home':'retry'}">${next ? `<span class="next-island">${art(world.sheet, 7 + result.index)}</span> Next! ${icon('arrow')}` : handoff ? `<span class="next-island">${art(handoff.sheet,0)}</span> Let’s go, ${handoff.name}! ${icon('arrow')}` : finished?`${icon('star')} Play our favorites`:`${icon('retry')} Play again`}</button>
    <div class="little-actions"><button class="menu-tool" data-action="home" aria-label="Choose a chapter or story">${icon('home')}</button>${next ? `<button class="menu-tool" data-action="retry" aria-label="Play this chapter again">${icon('retry')}</button>` : ''}</div>
    <details class="score-details"><summary>Score</summary><div><strong>${format(result.score)}${result.score > oldBest ? ' · New best!' : ''}</strong><span>${time(result.elapsed)}</span></div>${!endless ? `<p>Extra stars: ${Math.ceil(result.total * .85)} ${world.tokens} · Finish in ${time(mission.par)}</p>` : ''}</details>`;
}
