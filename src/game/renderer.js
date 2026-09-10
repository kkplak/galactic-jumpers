import { random } from './levels.js';
import { assetUrl, ATLAS_FILES } from './assets.js';
import { characterFor } from './characters.js';
import { platformArtwork, collapseShake } from './platform-art.js';
import { hookTarget } from './abilities.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export async function loadAssets(onProgress = () => {}) {
  const paths = { world: assetUrl('world.webp'), ...Object.fromEntries(Object.entries(ATLAS_FILES).map(([key,file])=>[key,assetUrl(`${file}.webp`)])) };
  const assets = {}; let loaded = 0;
  const results = await Promise.allSettled(Object.entries(paths).map(async ([name, path]) => {
    const image = new Image(); image.decoding = 'async';
    await new Promise((resolve, reject) => {image.onload = resolve;image.onerror = () => reject(new Error('Artwork could not be loaded.'));image.src = path;});
    assets[name] = image;onProgress(++loaded);
  }));
  const failure = results.find(x => x.status === 'rejected'); if (failure) throw failure.reason;
  const response = await fetch(assetUrl('sprites.json')); if (!response.ok) throw new Error('Sprite data could not be loaded.');
  const rects = await response.json();assets.rects = Object.fromEntries(Object.entries(ATLAS_FILES).map(([key,file])=>[key,rects[file]]));
  assets.surfaces=Object.fromEntries(Object.entries(ATLAS_FILES).filter(([,file])=>rects._surfaces?.[file]).map(([key,file])=>[key,rects._surfaces[file]]));
  return assets;
}

export class Renderer {
  constructor(canvas, assets, settings, onSignSeen = () => {}) {
    this.canvas = canvas;this.ctx = canvas.getContext('2d', {alpha: false}); if (!this.ctx) throw new Error('This browser does not support the game canvas.');
    this.assets = assets;this.settings = settings;this.camera = 0;this.particles = [];this.rings = [];this.callouts = [];this.shake = 0;this.flash = 0;
    this.seenSigns = new Set();this.onSignSeen = onSignSeen;
    const rand = random(887);this.stars = Array.from({length: 55}, () => ({x: rand(),y: rand(),r: rand() * 1.2 + 0.4,phase: rand() * 6.28}));
    this.resize();
  }
  setSeenSigns(ids) {this.seenSigns = new Set(ids);}
  hintOnce(id, fn) {if(this.seenSigns.has(id))return;this.seenSigns.add(id);this.onSignSeen(id);fn();}
  resize() {
    this.width = window.innerWidth;this.height = window.innerHeight;
    this.ratio = Math.min(window.devicePixelRatio || 1, 2);this.canvas.width = Math.round(this.width * this.ratio);this.canvas.height = Math.round(this.height * this.ratio);
    this.scale = Math.min(this.width / 480, this.height / 620, 1.45);
    this.offsetX = (this.width - 480 * this.scale) / 2;
    this.bottom = this.height - (this.height > this.width ? Math.min(164, this.height * 0.21) : 85);
    this.viewHeight = Math.max(250, (this.bottom - 90) / this.scale);
  }
  x(world) {return this.offsetX + world * this.scale;}
  y(world) {return this.bottom - (world - this.camera) * this.scale;}
  reset(game) {this.world=game.level.world;this.camera = Math.max(0, game.player.y - this.viewHeight * 0.38);this.particles = [];this.rings = [];this.callouts = [];this.shake = 0;this.flash = 0;}
  burst(x, y, color, count = 12) {
    if (this.settings.reducedMotion) count = Math.min(count, 4);
    for (let i = 0; i < count && this.particles.length < 150; i++) {
      const a = i / count * Math.PI * 2;const speed = 35 + Math.random() * 110;
      this.particles.push({x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed+35,life:0.55+Math.random()*.3,max:0.85,color,r:1.5+Math.random()*2});
    }
  }
  popup(text,x,y,kind,duration=2.6) {
    this.callouts=this.callouts.filter(item=>item.kind!==kind);
    this.callouts.push({text,x,y,kind,life:duration,duration});
    if(this.callouts.length>3)this.callouts.shift();
  }
  handle(event,game) {
    if (event.type === 'crystal') this.burst(event.x,event.y,this.world?.id==='bop'?'#8eeafa':this.world?.id==='pip'?'#c9f9a1':'#ffe69c',8);
    if (event.type === 'relic') {this.burst(event.x,event.y,'#ffdc8b',20);this.rings.push({x:event.x,y:event.y,r:5,life:.6,color:'#ffdc8b'});}
    if (event.type === 'checkpoint' || event.type === 'shield' || event.type === 'refuel') {this.burst(event.x,event.y+30,event.type==='refuel'?'#ffcf78':'#7feef6',18);this.rings.push({x:event.x,y:event.y+30,r:8,life:.75,color:'#8af7eb'});}
    if (event.type === 'jump' || event.type === 'double' || event.type === 'land') this.burst(event.x,event.y,'#a5ced4',event.type === 'double' ? 12 : 5);
    if (event.type === 'hurt') {this.shake=.28;this.flash=.23;this.burst(event.x,event.y,'#ffad91',20);}
    if (event.type === 'crumble') this.burst(event.x,event.y,'#b397ee',14);
    if (event.type === 'bonk') {this.burst(event.x,event.y,'#ffe28b',12);this.rings.push({x:event.x,y:event.y,r:5,life:.4,color:'#ffe28b'});}
    if(event.type==='tail'){this.burst(event.x,event.y,'#ffd29f',18);this.rings.push({x:event.x,y:event.y+4,r:8,life:.4,color:'#e4ffb0'});}
    if(event.type==='hook')this.burst(event.x,event.y+30,'#9af7f4',8);
    if(event.type==='checkpoint') {
      const platform=game?.platform(event.id);
      this.hintOnce('hint-checkpoint',()=>this.popup('✓ Saved!',platform?platform.x-platform.w*.32:event.x,event.y+45,'checkpoint'));
    }
    if(event.type==='refuel')this.hintOnce('hint-refuel-popup',()=>this.popup(game?.character==='nova'?'⚡ Full!':'✓ Ready!',game?.platform(game.player.groundId)?.x??event.x,event.y+12,'refuel',2.2));
    if(event.type==='goalLocked'&&game)this.hintOnce('hint-goal-locked',()=>this.popup(`Find ${event.missing} more!`,game.level.goal.x,game.level.goal.y+94,'goal',3.4));
  }
  sprite(name, index, x, y, width, height, flip = false, angle = 0, alpha = 1) {
    const c = this.ctx, rect = this.assets.rects[name][index];
    c.save();c.globalAlpha = alpha;c.translate(this.x(x),this.y(y));if (flip) c.scale(-1,1);if (angle) c.rotate(angle);
    c.drawImage(this.assets[name],...rect,-width*this.scale/2,-height*this.scale,width*this.scale,height*this.scale);c.restore();
  }
  glow(x, y, radius, color) {
    const c = this.ctx,s = this.scale;const px = this.x(x),py = this.y(y);const g=c.createRadialGradient(px,py,0,px,py,radius*s);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(px-radius*s,py-radius*s,radius*s*2,radius*s*2);
  }
  // Foreground speech bubbles use screen pixels so phone text stays legible.
  // They are drawn only after terrain, characters, particles, and flashes.
  drawCallout({text,x,y,compact=false,alpha=1}) {
    const c=this.ctx,fontSize=compact?13:14,lineHeight=fontSize+4;
    c.save();c.globalAlpha=alpha;c.font=`800 ${fontSize}px ui-rounded,system-ui,sans-serif`;
    const maxWidth=Math.min(264,this.width-24),lines=[];
    let line='';
    for(const word of text.split(' ')) {
      const next=line?`${line} ${word}`:word;
      if(line&&c.measureText(next).width>maxWidth-24){lines.push(line);line=word;}else line=next;
    }
    if(line)lines.push(line);
    const width=Math.min(maxWidth,Math.max(compact?27:46,...lines.map(value=>c.measureText(value).width+24)));
    const height=lines.length*lineHeight+(compact?8:14),anchorX=this.x(x),anchorY=this.y(y);
    const left=clamp(anchorX-width/2,12,this.width-width-12);
    const top=clamp(anchorY-(compact?height/2:height+9),Math.min(100,this.bottom-60),this.bottom-height-8);
    c.fillStyle=compact?'#18384bf5':'#fff4df';c.strokeStyle=compact?'#9edcda':'#ead4aa';c.lineWidth=1;
    c.shadowColor='#06182760';c.shadowBlur=5;c.shadowOffsetY=2;
    c.beginPath();c.roundRect(left,top,width,height,compact?10:12);c.fill();c.stroke();
    c.shadowBlur=0;c.shadowOffsetY=0;
    if(!compact&&anchorY>top+height&&anchorY<top+height+24){
      const tail=clamp(anchorX,left+12,left+width-12);
      c.beginPath();c.moveTo(tail-5,top+height-1);c.lineTo(tail,top+height+6);c.lineTo(tail+5,top+height-1);c.fill();
    }
    c.fillStyle=compact?'#e3faf1':'#34534f';c.textAlign='center';c.textBaseline='middle';
    lines.forEach((value,index)=>c.fillText(value,left+width/2,top+height/2+(index-(lines.length-1)/2)*lineHeight));
    c.restore();
  }
  draw(game, dt = 0) {
    const c = this.ctx, w = this.width, h = this.height, s = this.scale, p = game.player, world=game.level.world;
    const labels=[];
    this.callouts=this.callouts.filter(label=>(label.life=Math.max(0,label.life-dt))>0);
    const target = Math.max(0,p.y-this.viewHeight*.38);
    this.camera += (target-this.camera)*(this.settings.reducedMotion ? 1 : 1-Math.exp(-dt*7));
    c.setTransform(this.ratio,0,0,this.ratio,0,0);c.fillStyle='#061521';c.fillRect(0,0,w,h);
    const img=this.assets[world.sceneSheet], rect=this.assets.rects[world.sceneSheet][game.index];
    const cover=Math.max(w/rect[2],h/rect[3])*1.05,bw=rect[2]*cover,bh=rect[3]*cover;
    const ascent=clamp(this.camera/game.level.height,0,1);
    c.globalAlpha=.88;c.drawImage(img,...rect,(w-bw)/2,(h-bh)*(.72-ascent*.44),bw,bh);c.globalAlpha=1;
    c.fillStyle=game.level.mission.sky;c.globalAlpha=.14;c.fillRect(0,0,w,h);c.globalAlpha=1;
    const shade=c.createLinearGradient(0,0,0,h);shade.addColorStop(0,'#061827b0');shade.addColorStop(.4,'#07172215');shade.addColorStop(1,'#041427a6');c.fillStyle=shade;c.fillRect(0,0,w,h);
    const vignette=c.createLinearGradient(0,0,w,0);vignette.addColorStop(0,'#04121c80');vignette.addColorStop(.38,'#04121c36');vignette.addColorStop(.65,'#04121c36');vignette.addColorStop(1,'#04121c80');c.fillStyle=vignette;c.fillRect(0,0,w,h);
    for (const star of this.stars) {
      c.globalAlpha=this.settings.reducedMotion ? .45 : .35+Math.sin(game.elapsed*.6+star.phase)*.22;c.fillStyle=world.id==='pip'?'#f7f5b1':'#b8e6e8';c.beginPath();c.arc(star.x*w,((star.y*h+this.camera*.08)%h+h)%h,star.r,0,Math.PI*2);c.fill();
    } c.globalAlpha=1;
    c.save();
    this.shake=Math.max(0,this.shake-dt);if(this.shake&&!this.settings.reducedMotion)c.translate(Math.sin(game.elapsed*97)*this.shake*12,Math.cos(game.elapsed*85)*this.shake*7);
    // Functional route markers: lift travel, jetpack paths and local reminders.
    for(const trail of game.level.trails) {
      const from=game.platform(trail.from),to=game.platform(trail.to);
      if(this.y(to.y)>h+60||this.y(from.y)<-60)continue;
      c.strokeStyle='#ffd48745';c.lineWidth=3*s;c.setLineDash([5*s,12*s]);
      c.beginPath();c.moveTo(this.x(from.x),this.y(from.y+50));c.lineTo(this.x(to.x),this.y(to.y-30));c.stroke();c.setLineDash([]);
      this.hintOnce('hint-trail',()=>labels.push({text:'↑',x:from.x+(to.x-from.x)*.5,y:(from.y+to.y)*.5,compact:true}));
    }
    for(const platform of game.level.platforms) {
      const py=this.y(platform.y);if(py < -100||py>h+110)continue;
      const faded=platform.broken ? .14 : 1,fragile=platform.type==='fragile';
      if(platform.rise||platform.amplitude) {
        c.strokeStyle='#9df3f34d';c.lineWidth=2*s;c.setLineDash([3*s,7*s]);c.beginPath();
        c.moveTo(this.x(platform.baseX-platform.amplitude),this.y(platform.baseY));
        c.lineTo(this.x(platform.baseX+platform.amplitude),this.y(platform.baseY+platform.rise));c.stroke();c.setLineDash([]);
      }
      const terrainFrame=fragile?16:platform.type==='refuel'?17:game.index;
      const art=platformArtwork(platform,this.assets.rects[world.sheet][terrainFrame],this.assets.surfaces[world.sheet][terrainFrame]);
      const tremble=collapseShake(platform,game.elapsed,this.settings.reducedMotion);
      const warning=fragile&&platform.crumble>0&&!platform.broken;
      if(tremble){
        // Keep the painted contact edge fixed; the unstable underside rattles.
        c.save();c.beginPath();c.rect(-w,-h,w*3,py+h);c.clip();
        this.sprite(world.sheet,terrainFrame,art.x,art.y,art.width,art.height,false,0,faded);c.restore();
        c.save();c.beginPath();c.rect(-w,py,w*3,h*3);c.clip();
        this.sprite(world.sheet,terrainFrame,art.x+tremble,art.y,art.width,art.height,false,0,faded);c.restore();
      }else this.sprite(world.sheet,terrainFrame,art.x,art.y,art.width,art.height,false,0,faded);
      c.globalAlpha=faded;c.strokeStyle=warning?'#ffdc87':fragile?'#c79eff':platform.type==='refuel'?'#ffcd73':platform.type==='checkpoint'?'#bcf8ac':'#83d9d8';c.lineWidth=(warning?3:2)*s;
      c.beginPath();c.moveTo(this.x(platform.x-platform.w/2),py);c.lineTo(this.x(platform.x+platform.w/2),py);c.stroke();c.globalAlpha=1;
      if(platform.type==='moving')this.hintOnce('hint-moving',()=>labels.push({text:'‹ ›',x:platform.x,y:platform.y-19,compact:true}));
      if(platform.type==='lift')this.hintOnce('hint-lift',()=>labels.push({text:'↑ ↓',x:platform.x,y:platform.y-19,compact:true}));
      if(platform.type==='refuel'){
        this.glow(platform.x,platform.y,50,'#ffc36a28');
        this.hintOnce('hint-refuel-marker',()=>labels.push({text:world.id==='nova'?'⚡':'✓',x:platform.x,y:platform.y-19,compact:true}));
      }
      if(platform.type==='checkpoint' && platform.id!==game.level.platforms.length-1){
        this.glow(platform.x-platform.w*.32,platform.y+22,47,platform.id<=game.checkpoint?'#ccfb7740':'#65dce42b');
        this.sprite(world.sheet,14,platform.x-platform.w*.32,platform.y,32,45);
      }
    }
    const availableAnchor=world.id==='bop'&&p.fuel>=99?hookTarget(game):null;
    for(const anchor of game.level.anchors){
      const platform=game.platform(anchor.platformId),ay=platform.y+anchor.offsetY;
      if(anchor===availableAnchor&&this.y(ay)<124){
        // A small phone can hide the next gear above the HUD; point to it at
        // the top of the play area while keeping the real cable target intact.
        const edgeY=this.camera+(this.bottom-130)/s;
        this.glow(platform.x,edgeY,30,'#b3fff160');this.sprite(world.sheet,13,platform.x,edgeY-13,26,26);
        labels.push({text:'↑',x:platform.x,y:edgeY-29,compact:true});
      }
      if(platform.broken||this.y(ay)<-50||this.y(ay)>h+50)continue;
      const ready=anchor===availableAnchor||p.grapple?.platformId===platform.id;
      this.glow(platform.x,ay,ready?43:28,ready?'#b3fff175':'#b3fff12b');
      c.strokeStyle=ready?'#d8ffaf':'#83c5c5';c.lineWidth=(ready?3:1.5)*s;
      c.beginPath();c.arc(this.x(platform.x),this.y(ay),20*s,0,Math.PI*2);c.stroke();
      this.sprite(world.sheet,13,platform.x,ay-13,26,26);
    }
    if(p.grapple){
      const platform=game.platform(p.grapple.platformId),ay=platform.y+p.grapple.offsetY;
      c.strokeStyle='#173c50';c.lineWidth=5*s;c.beginPath();c.moveTo(this.x(p.x+p.facing*11),this.y(p.y+30));c.lineTo(this.x(platform.x),this.y(ay));c.stroke();
      c.strokeStyle='#a4ffed';c.lineWidth=2.5*s;c.stroke();
    }
    const sign=game.level.signs.filter(sign=>!this.seenSigns.has(sign.id)&&Math.abs(sign.y-p.y)<190&&this.y(sign.y)>110&&this.y(sign.y)<this.bottom+5).sort((a,b)=>Math.abs(a.y-p.y)-Math.abs(b.y-p.y))[0];
    if(sign&&!this.callouts.length){labels.push(sign);this.seenSigns.add(sign.id);this.onSignSeen(sign.id);}
    if(game.mode==='campaign') {
      const goal=game.level.goal;if(this.y(goal.y)>-140&&this.y(goal.y)<h+130){
        this.glow(goal.x,goal.y+40,95,game.crystals>=goal.required?'#74eeee55':'#74eeee20');
        this.sprite(world.sheet,15,goal.x,goal.y,87,94,false,0,game.crystals>=goal.required?1:.6);

      }
    }
    for(const item of game.level.collectibles){
      if(game.collected.has(item.id)||this.y(item.y)<-60||this.y(item.y)>h+60)continue;
      const bob=this.settings.reducedMotion?0:Math.sin(game.elapsed*2.3+item.platformId)*3;
      const size=item.type==='crystal'?24:item.type==='relic'?29:32;
      this.glow(item.x,item.y+bob,22,item.type==='crystal'?'#dff47425':item.type==='relic'?'#ffc96a20':'#86dffd30');
      this.sprite(item.type==='shield'?'objects':world.sheet,item.type==='crystal'?12:item.type==='relic'?13:7,item.x,item.y-size/2+bob,item.type==='crystal'?23:size,size);
    }
    for(const enemy of game.level.enemies){
      if(enemy.hidden||this.y(enemy.y)<-80||this.y(enemy.y)>h+80)continue;
      const bonked=enemy.stunned>0;
      if(enemy.type==='swooper'&&enemy.warning&&!bonked){
        c.strokeStyle='#ffc38d88';c.lineWidth=2*s;c.setLineDash([4*s,9*s]);
        c.beginPath();c.moveTo(this.x(48),this.y(enemy.y));c.lineTo(this.x(432),this.y(enemy.y));c.stroke();c.setLineDash([]);
      }
      const spriteFrame={crawler:18,hopper:19,swooper:20,drone:21}[enemy.type];
      const height=enemy.type==='crawler'?32:enemy.type==='hopper'?(enemy.state==='hop'?43:enemy.warning?27:34):39;
      const rect=this.assets.rects[world.sheet][spriteFrame],width=Math.min(enemy.type==='swooper'?59:48,height*rect[2]/rect[3]);
      const tilt=this.settings.reducedMotion||bonked?0:enemy.type==='crawler'?Math.sin(enemy.age*12)*.055:enemy.type==='swooper'&&enemy.state==='dash'?.08:0;
      this.glow(enemy.x,enemy.y,30,bonked?'#ffe58b25':'#ffb38c18');
      this.sprite(world.sheet,spriteFrame,enemy.x,enemy.y-height/2,width,height,enemy.facing<0,tilt,bonked?.45:1);
    }
    if(game.mode==='campaign'){
      const companionX=p.x-p.facing*31,companionY=p.y+44+(this.settings.reducedMotion?0:Math.sin(game.elapsed*2.5)*3);
      this.glow(companionX,companionY+12,23,world.id==='pip'?'#c9f9a12a':world.id==='bop'?'#80eefa2a':'#ffe69c30');
      this.sprite(world.sheet,22,companionX,companionY,26,28);
    }
    if(p.grounded){c.globalAlpha=.26;c.fillStyle='#020b14';c.beginPath();c.ellipse(this.x(p.x),this.y(p.y)+2*s,20*s,4*s,0,0,Math.PI*2);c.fill();c.globalAlpha=1;}
    let frame = p.boosting?(game.character==='nova'?5:3):p.landing>0?6:!p.grounded?(p.vy>0?3:4):Math.abs(p.vx)>12?1+Math.floor(game.elapsed*9)%2:0;
    const spriteHeight=frame===6?43:frame===3?51:57;
    const spriteWidth=frame===5?58:frame===6?46:43;
    const blink=p.invulnerable>0?(.55+Math.sin(game.elapsed*26)*.25):1;
    const tilt=frame===1||frame===2?(this.settings.reducedMotion?0:Math.sin(game.elapsed*18)*.035):0;
    this.sprite(characterFor(game.character).sheet,frame,p.x,p.y,spriteWidth,spriteHeight,p.facing<0,tilt,blink);
    if(game.character==='nova'&&p.boosting && dt>0 && !this.settings.reducedMotion && this.particles.length<150 && Math.random()<.55)this.particles.push({x:p.x-p.facing*12,y:p.y+6,vx:(Math.random()-.5)*30,vy:-90,life:.3,max:.3,color:'#82ecf5',r:3});
    for(let i=this.particles.length-1;i>=0;i--){const a=this.particles[i];a.life-=dt;if(a.life<=0){this.particles.splice(i,1);continue;}a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy-=150*dt;c.globalAlpha=clamp(a.life/a.max,0,1);c.fillStyle=a.color;c.beginPath();c.arc(this.x(a.x),this.y(a.y),a.r*s,0,Math.PI*2);c.fill();}c.globalAlpha=1;
    for(let i=this.rings.length-1;i>=0;i--){const a=this.rings[i];a.life-=dt;if(a.life<=0){this.rings.splice(i,1);continue;}a.r+=90*dt;c.globalAlpha=a.life;c.strokeStyle=a.color;c.lineWidth=2*s;c.beginPath();c.arc(this.x(a.x),this.y(a.y),a.r*s,0,Math.PI*2);c.stroke();}c.globalAlpha=1;
    c.restore();
    this.flash=Math.max(0,this.flash-dt);if(this.flash&&!this.settings.reducedMotion){c.fillStyle=`rgba(255,119,78,${this.flash*.25})`;c.fillRect(0,0,w,h);}
    for(const label of labels){if(this.y(label.y)>100&&this.y(label.y)<this.bottom+28)this.drawCallout(label);}
    for(const label of this.callouts){
      if(this.y(label.y)<80||this.y(label.y)>this.bottom+45)continue;
      this.drawCallout({...label,alpha:Math.min(1,label.life/.3)});
    }
  }
}
