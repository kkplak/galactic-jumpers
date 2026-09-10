// Original, offline scores. Each chapter has its own melody, meter, harmony,
// tempo and orchestration; a 32-bar arrangement adds replies and quiet passages.
const SCALES={major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],dorian:[0,2,3,5,7,9,10],lydian:[0,2,4,6,7,9,11],mixolydian:[0,2,4,5,7,9,10]};
const score=(title,bpm,beats,key,scale,lead,motif,chords,texture,echo=0)=>Object.freeze({title,bpm,beats,key,scale:SCALES[scale],lead,motif,chords,texture,echo});
export const SCORES=Object.freeze({
  nova:[
    score('Small Steps',68,4,60,'lydian','bell',[7,null,9,11,10,null,9,7,4,null,7,9,8,null,7,null],[0,0,3,4,5,3,4,0],'space',.22),
    score('Orbit Waltz',82,3,64,'minor','glass',[7,9,11,10,null,9,7,4,6,8,null,7],[0,3,6,4,0,5,3,4],'waltz',.28),
    score('Under the Amethyst',62,4,62,'dorian','glass',[7,null,null,11,null,9,null,8,4,null,7,null,6,null,null,7],[0,0,3,3,5,4,1,0],'cave',.4),
    score('Sunbeam Engine',102,4,57,'major','reed',[7,7,9,null,11,10,9,7,8,9,11,12,11,null,9,7],[0,3,0,4,5,3,4,0],'pulse',.12),
    score('Ribbon Lights',72,3,65,'major','flute',[7,null,11,12,null,11,9,null,8,7,null,4],[0,3,5,4,0,1,3,0],'air',.3),
    score('A Star Comes Home',88,4,60,'major','celesta',[7,9,11,null,14,12,11,9,10,11,12,11,9,8,7,null],[0,4,5,3,0,1,4,0],'finale',.2),
  ],
  pip:[
    score('Fern Footsteps',86,4,67,'major','flute',[4,7,9,8,7,null,4,5,7,8,9,null,8,5,4,null],[0,3,0,4,5,3,4,0],'forest',.1),
    score('Mushroom Hop',104,3,60,'major','wood',[7,9,7,11,10,9,8,10,8,12,11,null],[0,4,0,3,5,1,4,0],'bounce',.06),
    score('Root Lullaby',64,4,64,'dorian','wood',[4,null,7,null,6,4,null,3,2,null,4,6,7,null,4,null],[0,0,3,4,0,5,3,0],'cave',.32),
    score('Honeybee Dance',100,4,65,'major','mallet',[7,9,11,9,7,8,9,null,11,12,11,9,8,7,4,null],[0,3,4,0,5,3,1,4],'bounce',.08),
    score('Cloud Flowers',76,3,62,'lydian','flute',[7,null,9,11,12,null,11,9,8,7,4,null],[0,3,0,5,3,1,4,0],'air',.25),
    score('The Heart Tree Wakes',92,4,67,'major','bell',[4,7,9,null,11,9,8,7,9,11,12,11,9,7,4,null],[0,3,5,4,0,3,4,0],'forest',.16),
  ],
  bop:[
    score('Pebbles and Bolts',94,4,62,'major','mallet',[7,4,7,9,8,null,7,4,5,7,9,11,9,null,7,null],[0,4,3,0,5,1,4,0],'beach',.12),
    score('Bubble Waltz',90,3,57,'mixolydian','bubble',[7,11,9,7,4,null,8,12,10,8,5,null],[0,3,6,4,0,1,3,0],'bubble',.18),
    score('Little Clockmaker',112,4,60,'minor','pluck',[7,4,7,8,9,8,7,null,6,4,6,7,8,7,6,4],[0,3,0,4,5,3,4,0],'clock',.08),
    score('Pocket Rockets',116,4,64,'major','reed',[7,9,11,14,12,11,9,null,8,10,12,11,9,8,7,null],[0,4,5,3,0,1,4,0],'pulse',.14),
    score('Magnetic Moon',78,4,59,'dorian','glass',[7,null,11,9,null,8,7,null,4,6,null,8,9,null,7,null],[0,3,5,4,0,6,3,0],'space',.34),
    score('Every Window Glows',96,3,62,'major','celesta',[7,9,11,14,12,11,9,11,12,11,9,7],[0,4,5,3,0,1,4,0],'finale',.22),
  ],
});
export const musicFor=(character,index)=>SCORES[character]?.[Math.max(0,Math.min(5,Math.floor(index)))]??SCORES.nova[0];
const pitch=(profile,degree)=>profile.key+Math.floor(degree/7)*12+profile.scale[((degree%7)+7)%7];

export function scoreEvents(profile,step) {
  const eighth=30/profile.bpm,barLength=profile.beats*2,bar=Math.floor(step/barLength)%32,beat=step%barLength;
  const root=profile.chords[bar%profile.chords.length],section=Math.floor(bar/8),quiet=section===2;
  const notes=[],add=(degree,instrument,duration,volume,delay=0)=>notes.push({midi:pitch(profile,degree),instrument,duration:duration*eighth,volume,delay:delay*eighth});
  if(beat===0){
    for(const interval of [-7,-5,-3])add(root+interval,'pad',barLength*1.15,quiet?.016:.022);
    add(root-14,'bass',barLength*.8,quiet?.06:.085);
  }
  const cell=step%profile.motif.length;
  let melody=profile.motif[cell];
  if(melody!==null&&!(quiet&&beat%2===1)){
    // Answer phrases settle downward; the last four bars return to the motif.
    if(section===1&&bar%4>=2)melody-=2;
    if(section===3&&bar%8<4)melody+=2;
    add(root+melody,profile.lead,profile.lead==='flute'?1.6:2.7,quiet?.075:.105);
    if(profile.echo)add(root+melody,'echo',2.4,.105*profile.echo,1.5);
  }
  if(!quiet&&section!==0&&beat%2===1)add(root+[-7,-3,-5][Math.floor(beat/2)%3],'pluck',.9,.031);
  if(!quiet){
    const texture=profile.texture;
    if(['pulse','clock','bounce','beach','forest','finale'].includes(texture)&&beat===0)add(-14,'kick',.65,.10);
    if(['pulse','clock'].includes(texture)&&beat%2===1)add(7,'tick',.18,texture==='clock'?.025:.016);
    if(['forest','bounce','beach'].includes(texture)&&beat===barLength-2)add(0,'wood',.4,.04);
    if(texture==='bubble'&&beat===4)add(7,'bubble',.65,.035);
    if((texture==='waltz'||texture==='finale')&&beat===2)add(root-3,'mallet',1,.035);
  }
  return notes;
}

// Sine-heavy voices stay soft on phone speakers. Harmonics give woods, bells,
// flutes and little machines distinct colors without downloaded audio files.
export const INSTRUMENTS=Object.freeze({
  bell:{partials:[[1,1,'sine'],[2.01,.22,'sine'],[3.98,.055,'sine']]},
  celesta:{partials:[[1,1,'sine'],[3,.14,'sine'],[5,.035,'sine']]},
  glass:{partials:[[1,1,'sine'],[2.76,.12,'sine']],attack:.025},
  flute:{partials:[[1,1,'sine'],[2,.095,'sine']],attack:.075},
  wood:{partials:[[1,1,'sine'],[3.02,.13,'sine']],decay:.45},
  mallet:{partials:[[1,1,'sine'],[4,.055,'sine']],decay:.7},
  pluck:{partials:[[1,.8,'triangle'],[2,.04,'sine']],decay:.45},
  reed:{partials:[[1,.75,'triangle'],[2,.08,'sine']],attack:.03},
  bubble:{partials:[[1,1,'sine']],bend:.65,decay:.6},
  pad:{partials:[[1,1,'sine'],[1.003,.28,'sine']],attack:.35},
  bass:{partials:[[1,1,'sine'],[2,.06,'sine']],attack:.035},
  echo:{partials:[[1,1,'sine']],attack:.02},
  kick:{partials:[[1,1,'sine']],bend:.48},
  tick:{partials:[[1,1,'triangle']],bend:.6},
});
