import { LEVEL_REVISION } from './levels.js';
import { CHARACTERS, characterFor } from './characters.js';
const KEY = 'galactic-jumpers-v1';
const number = (v, fallback = 0, max = 1e9) => Number.isFinite(v) ? Math.min(max, Math.max(0, v)) : fallback;
export const defaultSettings = () => ({ music: true, effects: true, haptics: true, reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false, leftHanded: false, assist: false });
const freshJourney = () => ({ unlocked: 0, missions: Array.from({length:6},()=>({stars:0,bestScore:0,bestTime:0,relics:0})), activeRun: null });
export const progressFor = (data, id = data.character) => data.journeys[characterFor(id).id];
export const worldFinished = (data,id) => progressFor(data,id).missions.every(m=>m.stars>0);
export const storyStage = data => {const first=CHARACTERS.findIndex(c=>!worldFinished(data,c.id));return first<0?2:first;};
export const characterUnlocked = (data,id) => CHARACTERS.findIndex(c=>c.id===id)>=0&&CHARACTERS.findIndex(c=>c.id===id)<=storyStage(data);
export const nextFriend = id => CHARACTERS[CHARACTERS.findIndex(c=>c.id===id)+1]??null;

export function freshSave() {
  const data = { version: 3, character: 'nova', journeys: Object.fromEntries(CHARACTERS.map(({id})=>[id,freshJourney()])), endlessBest: 0, settings: defaultSettings(), tutorialSeen: false, abilityGuides: {nova:false,pip:false,bop:false} };
  // Convenience views for the selected journey. Only the explicit journeys map
  // is serialized, so saves never contain competing copies of progress.
  for (const key of ['unlocked','missions','activeRun']) Object.defineProperty(data,key,{
    get:()=>progressFor(data)[key], set:value=>{progressFor(data)[key]=value;}, enumerable:false,
  });
  return data;
}

function validateJourney(value, id) {
  const clean=freshJourney();
  clean.unlocked=Math.floor(number(value?.unlocked,0,5));
  clean.missions=clean.missions.map((_mission,i)=>{
    const source=value?.missions?.[i];
    return {stars:Math.floor(number(source?.stars,0,3)),bestScore:Math.floor(number(source?.bestScore)),bestTime:number(source?.bestTime),relics:Math.floor(number(source?.relics,0,3))};
  });
  const run=value?.activeRun;
  // Nova's geometry is unchanged. Other old checkpoints restart on the new routes.
  const compatible=run?.revision===LEVEL_REVISION||(id==='nova'&&run?.revision===2);
  if(run && run.character===id && compatible && Number.isInteger(run.index) && run.index>=0 && run.index<=clean.unlocked && Number.isInteger(run.checkpoint) && run.checkpoint>=0 && run.checkpoint<=24){
    clean.activeRun={revision:LEVEL_REVISION,index:run.index,character:id,checkpoint:run.checkpoint,collected:Array.isArray(run.collected)?run.collected.filter(x=>typeof x==='string'&&/^[crs]\d+(-[0-4])?$/.test(x)).slice(0,100):[],elapsed:number(run.elapsed,0,86400),health:Math.max(1,Math.floor(number(run.health,3,5))),maxHeight:number(run.maxHeight,0,10000),assist:run.assist===true};
  }
  return clean;
}

export function validateSave(value) {
  const clean=freshSave();
  if(!value || ![1,2,3].includes(value.version))return clean;
  clean.character=characterFor(value.character).id;
  clean.endlessBest=Math.floor(number(value.endlessBest));clean.tutorialSeen=value.tutorialSeen===true;
  for(const {id} of CHARACTERS)clean.abilityGuides[id]=value.version===3?value.abilityGuides?.[id]===true:id==='nova'&&clean.tutorialSeen;
  for(const key of Object.keys(clean.settings))if(typeof value.settings?.[key]==='boolean')clean.settings[key]=value.settings[key];
  if(value.version===1){
    // The earlier shared campaign used Nova's routes. Preserve it there once;
    // the newly introduced forest and city journeys begin independently.
    clean.journeys.nova=validateJourney({...value,activeRun:value.activeRun?{...value.activeRun,character:'nova'}:null},'nova');
    clean.character='nova';
  }else{
    for(const {id} of CHARACTERS)clean.journeys[id]=validateJourney(value.journeys?.[id],id);
  }
  if(value.version<3||!characterUnlocked(clean,clean.character))clean.character=CHARACTERS[storyStage(clean)].id;
  return clean;
}

export class SaveStore {
  constructor(storage) {
    this.available=true;this.restartedIndex=null;this.migrated=false;
    try{
      this.storage=storage??globalThis.localStorage;
      const source=JSON.parse(this.storage.getItem(KEY)||'null');this.data=validateSave(source);
      const oldRun=source?.version===1?source.activeRun:source?.journeys?.[this.data.character]?.activeRun;
      if(oldRun && !this.data.activeRun && oldRun.revision!==LEVEL_REVISION && Number.isInteger(oldRun.index) && oldRun.index>=0 && oldRun.index<=this.data.unlocked)this.restartedIndex=oldRun.index;
      this.migrated=!!source&&source.version<3;if(this.migrated)this.write();
    }catch{this.data=freshSave();this.available=false;}
  }
  write(){try{this.storage.setItem(KEY,JSON.stringify(this.data));this.available=true;return true;}catch{this.available=false;return false;}}
  setRun(run){progressFor(this.data,run?.character??this.data.character).activeRun=run;return this.write();}
  chooseCharacter(id){if(!characterUnlocked(this.data,id))return false;this.data.character=id;return this.write();}
  complete(result){
    const progress=progressFor(this.data,result.character??this.data.character);
    if(result.mode==='endless')this.data.endlessBest=Math.max(this.data.endlessBest,result.score);
    else if(result.won){
      const mission=progress.missions[result.index];
      mission.stars=Math.max(mission.stars,result.stars);mission.bestScore=Math.max(mission.bestScore,result.score);mission.relics=Math.max(mission.relics,result.relics);
      mission.bestTime=mission.bestTime?Math.min(mission.bestTime,result.elapsed):result.elapsed;
      progress.unlocked=Math.max(progress.unlocked,Math.min(5,result.index+1));
      const next=nextFriend(result.character??this.data.character);
      if(result.index===5&&next&&worldFinished(this.data,result.character??this.data.character)&&characterUnlocked(this.data,next.id))this.data.character=next.id;
    }
    if(result.mode!=='endless')progress.activeRun=null;
    return this.write();
  }
}
