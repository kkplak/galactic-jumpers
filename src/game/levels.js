import { createEnemy } from './enemies.js';
import { journeyFor } from './story.js';
export const WORLD_WIDTH = 480;
export const STEP = 1 / 120;
export const LEVEL_REVISION = 3;
export const PHYSICS = Object.freeze({ gravity: 1100, jump: 490, speed: 230, acceleration: 1800, coyote: 0.12, buffer: 0.15, boost: 1700, fuelUse: 36, fuelRegen: 46 });

export const MISSIONS = [
  { name: 'First light', place: 'The outer rim', activity: 'Explore & climb', brief: 'Follow the crystal trail. Try a double jump on the tall steps!', color: '#dafa69', sky: '#143749', required: 8, par: 65, kind: 'garden' },
  { name: 'Drifting ruins', place: 'The broken belt', activity: 'Ride the lifts', brief: 'Ride the up-and-down rocks. Jump off near the top!', color: '#76e6e8', sky: '#123d4a', required: 12, par: 105, kind: 'lifts' },
  { name: 'Violet hollow', place: 'The echo moon', activity: 'Crumbling stairs', brief: 'Keep hopping along the purple stairs. Rest on the wide blue rocks.', color: '#c6a1ff', sky: '#312548', required: 16, par: 80, kind: 'stairs' },
  { name: 'Solar tide', place: 'The amber sea', activity: 'Jetpack adventure', brief: 'Hold BOOST through the golden trails. Land on FUEL pads to fill up!', color: '#ffca79', sky: '#453732', required: 14, par: 100, kind: 'jetpack' },
  { name: 'Silent orbit', place: 'The far side', activity: 'Moon jumps', brief: 'Low gravity! Enjoy long, floaty jumps. Tap jump again near the top.', color: '#91b9ff', sky: '#1c304f', required: 12, par: 100, kind: 'moon', gravity: 680 },
  { name: 'The last beacon', place: 'The starlight spire', activity: 'The grand adventure', brief: 'Stairs, lifts, then a jetpack finale. You know all the moves!', color: '#eafa9a', sky: '#28413e', required: 24, par: 145, kind: 'final' },
];

export function random(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = Math.imul(a ^ a >>> 15, 1 | a); t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

const rock = (x, y, w = 164, type = 'stone', extra = {}) => ({ x, y, w, type, ...extra });
const safe = (x, y, w = 198) => rock(x, y, w, 'checkpoint');
const fragile = (x, y, w = 106) => rock(x, y, w, 'fragile');
const lift = (x, y, rise, speed = .8) => rock(x, y, 138, 'lift', { rise, speed });
const drift = (x, y, amplitude = 80, speed = .85) => rock(x, y, 142, 'moving', { amplitude, speed });
const fuel = (x, y, w = 190) => rock(x, y, w, 'refuel');

// Each authored formation teaches a different movement decision. Platform IDs
// are stable within this revision, and destinations are one-way surfaces.
const COURSES = [
  [rock(235,72,208), rock(292,152,176), rock(353,235,152), safe(325,332,204),
    rock(232,428,174), rock(132,512,166), rock(123,612,152), safe(140,738,204),
    rock(238,832,204), rock(338,902,140), rock(330,1040,154), safe(240,1175,212)],
  [rock(150,80,190), lift(150,168,140,.75), safe(335,410,184), drift(240,505,82),
    rock(118,590,164), lift(118,675,170), safe(285,950,208), rock(345,1042,152),
    lift(345,1130,170,.85), safe(170,1400,192), drift(245,1500,95), safe(305,1610,212)],
  [rock(82,70,148), fragile(148,120), fragile(220,170,102), fragile(292,220,102),
    fragile(363,270,108), safe(365,365,172), fragile(302,422,102), fragile(233,476,100),
    fragile(161,530,100), fragile(88,584,108), safe(102,690,188), rock(102,838,148),
    fragile(178,897,98), fragile(254,954,98), fragile(330,1011,98), safe(339,1110,192),
    fragile(267,1190,118), safe(233,1310,216)],
  [fuel(200,85,204), fuel(200,410,180), safe(325,765,198), fuel(328,855,166),
    fuel(162,1215,200), safe(164,1555,196), fuel(312,1650,168), fuel(312,2015,194), safe(230,2375,216)],
  [rock(135,145,184), rock(326,405,174), safe(329,685,194), drift(218,945,55,.35),
    rock(110,1195,170), safe(154,1470,200), rock(354,1715,152), rock(342,1975,148),
    safe(126,2230,198), drift(223,2465,60,.42), safe(300,2740,216)],
  [rock(100,80,180), fragile(170,140), fragile(245,202), safe(328,284,190),
    lift(328,382,150,.9), rock(145,610,172), drift(220,710,85), safe(340,815,190),
    fuel(340,1160,184), safe(160,1505,202), fragile(93,1573,112), fragile(173,1640),
    fragile(254,1707), safe(335,1790,192), lift(335,1880,135,.9), safe(163,2120,196),
    fuel(236,2490,186), safe(240,2850,228)],
];

const RELICS = [[3,7,11], [2,6,11], [5,10,15], [2,5,8], [2,7,10], [5,12,17]];
const SIGNS = [
  [[240,24,'Follow the crystals!'], [123,664,'Tall step? Jump twice!']],
  [[150,116,'Ride up. Jump off!'], [245,1446,'Catch a moving rock']],
  [[240,16,'Keep hopping!'], [365,390,'Blue rocks are safe'], [102,754,'A big jump, then more stairs!']],
  [[200,120,'Hold BOOST to fly!'], [328,892,'Land to refill'], [164,1590,'Watch for crossing robots']],
  [[240,38,'Low gravity · big moon jumps'], [329,728,'Jump again near the top!']],
  [[240,18,'You know the moves!'], [340,852,'Jetpack time!'], [335,1830,'One more lift'], [236,2528,'Light the last beacon!']],
];
// Checkpoints, refuel pads, and the first world stay peaceful. Introduce one
// creature at a time before mixing them in the final world.
const CREATURES = [[],
  [{ type: 'crawler', platformId: 5 }],
  [{ type: 'hopper', platformId: 12 }],
  [{ type: 'swooper', baseY: 1030 }, { type: 'drone', baseY: 1830 }],
  [{ type: 'hopper', platformId: 5 }, { type: 'crawler', platformId: 7 }, { type: 'drone', baseY: 2340, speed: .4 }],
  [{ type: 'crawler', platformId: 6 }, { type: 'swooper', baseY: 1340 }, { type: 'hopper', platformId: 15 }, { type: 'drone', baseY: 2300 }],
];

function timedCourse() {
  const rand = random(8801), course = [];
  let x = 240, y = 0;
  // Repeat formations rather than every other direction. A fixed seed keeps
  // personal score attempts comparable, with stairs, columns, drifts and jets.
  // Taller than even 120 seconds at the maximum jump velocity: the challenge
  // cannot run out of platforms before its timer expires.
  for (let section = 0; section < 96; section++) {
    const motif = section % 4, direction = Math.floor(section/4) % 2 ? -1 : 1;
    for (let step = 0; step < 6; step++) {
      if (motif === 0) { x = 80 + (direction > 0 ? step : 5-step) * 64; y += 62; }
      else if (motif === 1) { x = step < 3 ? 140 : 330; y += 105; }
      else if (motif === 2) { x = 240 + Math.sin(step*.7 + section)*110; y += 100; }
      else { x = 240 + Math.sin(step*.6)*95; y += step%2 ? 285 : 85; }
      const type = step === 5 ? 'checkpoint' : motif === 3 ? 'refuel' : motif === 0 && section > 0 ? 'fragile' : motif === 2 ? 'moving' : 'stone';
      course.push(rock(x,y,type==='checkpoint'?208:motif===0?136:174,type,{amplitude:type==='moving'?30:0,phase:rand()*Math.PI*2}));
    }
  }
  return course;
}

export function makeLevel(index = 0, endless = false, character = 'nova') {
  index = Math.max(0, Math.min(5, Math.floor(index)));
  const world=journeyFor(character),chapter=world.chapters[index];
  const mission={...MISSIONS[index],...chapter,name:chapter.title,place:world.name};
  if(endless)Object.assign(mission,{gravity:PHYSICS.gravity,kind:'timed',par:120});
  const spread=endless?1:world.alternatingRoute&&index%2===1?-1:world.horizontalScale;
  const course = endless ? timedCourse() : COURSES[index].map(p=>({...p,x:240+(p.x-240)*spread,amplitude:(p.amplitude??0)*spread}));
  let gateY=Infinity,storyRise=0;
  if(!endless&&world.id!=='nova'){
    const gate=[5,8,12,2,5,9][index]-1,previous=course[gate-1];
    const gap=index===4?430:336,extra=Math.max(0,gap-(course[gate].y-previous.y));
    gateY=course[gate].y;storyRise=extra;
    for(let i=gate;i<course.length;i++)course[i].y+=extra;
  }
  const raised=y=>y+(y>=gateY?storyRise:0);
  const platforms = [rock(240,0,440,'base'), ...course].map((p,id) => ({
    amplitude: 0, rise: 0, phase: 0, speed: .9, broken: false, crumble: 0,
    ...p, id, baseX: p.x, baseY: p.y, previousY: p.y,
  }));
  const collectibles = [], enemies = [], trails = [];
  const addItem = (id, type, platform, offsetX, offsetY) => collectibles.push({
    id, type, platformId: platform.id, offsetX, offsetY, x: platform.x+offsetX, y: platform.y+offsetY,
  });
  for (const platform of platforms.slice(1)) {
    const i = platform.id, previous = platforms[i-1];
    addItem(`c${i}-0`, 'crystal', platform, -20*Math.sign(spread), 32);
    addItem(`c${i}-1`, 'crystal', platform, 20*Math.sign(spread), 32);
    if (!endless && RELICS[index].includes(i)) addItem(`r${i}`, 'relic', platform, Math.sign(spread)*(i%2?1:-1)*Math.min(70,platform.w*.4), 67);
    if (platform.type === 'checkpoint' && i < platforms.length-1 && i > 4) addItem(`s${i}`, 'shield', platform, -platform.w*.3*Math.sign(spread), 34);
    if (platform.baseY-previous.baseY > (mission.kind==='moon'?400:280) && !previous.rise) {
      platform.approach = world.id==='nova'?'boost':world.id==='pip'?'tail':'hook';
      trails.push({from:previous.id,to:i});
      for (let j=2; j<=4; j++) {
        const t=(j-1)/4;
        addItem(`c${i}-${j}`, 'crystal', platform, (previous.x-platform.x)*(1-t), (previous.y-platform.y)*(1-t)+23);
      }
    }
  }
  const creatures = endless ? platforms.filter(p=>p.id>15&&p.id%11===0&&p.type!=='checkpoint').map((p,i)=>
    i%3===0 && ['stone','moving'].includes(p.type) ? {type:'crawler',platformId:p.id} : {type:i%2?'swooper':'drone',baseY:p.y+70}) : CREATURES[index];
  creatures.forEach((creature,id)=>{
    const platform=platforms[creature.platformId];
    enemies.push(createEnemy(creature.type,{...creature,id:`e${id}`,baseX:platform?.x??240,baseY:platform?platform.y+17:raised(creature.baseY)}));
  });
  const last = platforms.at(-1);
  const anchors=world.id==='bop'?platforms.filter(p=>p.approach==='hook').map(p=>({platformId:p.id,offsetY:84})):[];
  const abilityTip=world.id==='pip'?'Tap TAIL for a big leap!':world.id==='bop'?'Hold HOOK near a glowing gear!':'Hold FLY to fly!';
  const signs=endless?[{x:240,y:24,text:'Two minutes. How high can you go?',id:'sign-endless'}]:SIGNS[index].map(([x,y,text],i)=>({x:240+(x-240)*spread,y:raised(y),text:text.replace('Blue rocks are safe','Glowing spots save your place').replace('crystals',world.tokens).replace('robots','flyers').replace('Hold BOOST to fly!',abilityTip).replace('Jetpack time!',abilityTip).replace('Land to refill',world.id==='nova'?'Land to refill':'Land to recharge'),id:`sign-${character}-${index}-${i}`}));
  if(world.id!=='nova'&&trails.length){const from=platforms[trails[0].from];signs.unshift({x:from.x,y:from.y+48,text:abilityTip,id:`sign-${character}-${index}-ability`});}
  return { revision: LEVEL_REVISION, mission, world, chapter, platforms, collectibles, enemies, trails, anchors,
    signs,
    gravity: mission.gravity ?? PHYSICS.gravity, height: last.y,
    goal: { x:last.x, y:last.y, platformId:last.id, required:mission.required }, endless };
}
