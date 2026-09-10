import { makeLevel, WORLD_WIDTH, PHYSICS, LEVEL_REVISION } from './levels.js';
import { characterFor } from './characters.js';
import { stepEnemy, enemyContact } from './enemies.js';
import { updateAbility } from './abilities.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const approach = (value, target, amount) => value < target ? Math.min(value + amount, target) : Math.max(value - amount, target);

/** Pure, fixed-step simulation. No DOM, audio, timers or rendering side effects. */
export class Expedition {
  constructor({ index = 0, mode = 'campaign', assist = false, character = 'nova', snapshot = null } = {}) {
    this.index = index; this.mode = mode; this.assist = snapshot ? snapshot.assist : assist;
    this.character = characterFor(snapshot?.character ?? character).id;
    this.level = makeLevel(index, mode === 'endless', this.character);
    this.maxHealth = this.assist ? 5 : 3; this.health = this.maxHealth;
    this.elapsed = 0; this.maxHeight = 0; this.collected = new Set(); this.checkpoint = 0; this.state = 'playing'; this.events = [];
    this.player = { x: 240, y: 0, vx: 0, vy: 0, w: 24, h: 40, fuel: 100, facing: 1, grounded: true, groundId: 0, jumps: 0, coyote: PHYSICS.coyote, buffer: 0, invulnerable: 0, boosting: false, lastLandY: 0, landing: 0, lastPlatformId:0,tailTime:0,grapple:null,abilityHeld:false };
    this.goalHintAt = -10; this.nextSecond = 1;
    if (snapshot?.revision === LEVEL_REVISION) this.restore(snapshot);
  }
  get crystals() { let n = 0; for (const id of this.collected) if (id[0] === 'c') n++; return n; }
  get relics() { let n = 0; for (const id of this.collected) if (id[0] === 'r') n++; return n; }
  get score() { return Math.floor(this.maxHeight * 2) + this.crystals * 100 + this.relics * 350; }
  emit(type, data = {}) { this.events.push({ type, ...data }); }
  drainEvents() { const events = this.events; this.events = []; return events; }
  platform(id) { return this.level.platforms[id]; }
  restore(snapshot) {
    const cp = this.platform(snapshot.checkpoint);
    this.checkpoint = cp && (cp.type === 'checkpoint' || cp.type === 'base') ? cp.id : 0;
    const validIds = new Set(this.level.collectibles.map(x => x.id));
    this.collected = new Set(snapshot.collected.filter(x => validIds.has(x)));
    this.elapsed = snapshot.elapsed; this.maxHeight = Math.min(snapshot.maxHeight, this.level.height + 500);
    this.health = clamp(snapshot.health, 1, this.maxHealth); this.respawn();
  }
  snapshot() { return this.mode === 'endless' || this.state === 'ended' ? null : { revision: LEVEL_REVISION, index: this.index, character: this.character, checkpoint: this.checkpoint, collected: [...this.collected], elapsed: this.elapsed, health: this.health, maxHeight: this.maxHeight, assist: this.assist }; }
  respawn() {
    const cp = this.platform(this.checkpoint) || this.platform(0);
    Object.assign(this.player, { x: cp.x, y: cp.y, vx: 0, vy: 0, fuel: 100, grounded: true, groundId: cp.id, jumps: 0, coyote: PHYSICS.coyote, buffer: 0, invulnerable: 2, boosting: false, lastLandY: cp.y,lastPlatformId:cp.id,tailTime:0,grapple:null,abilityHeld:false });
    for (const platform of this.level.platforms) { platform.broken = false; platform.crumble = 0; platform.recover = 0; }
  }
  damage(reason) {
    if (this.player.invulnerable > 0) return;
    this.health--; this.emit('hurt', { reason, x: this.player.x, y: this.player.y + 25 });
    if (this.health <= 0) { this.finish(false, reason); return; }
    this.respawn(); this.emit('respawn', { checkpoint: this.checkpoint });
  }
  finish(won, reason = '') {
    if (this.state === 'ended') return;
    this.state = 'ended'; this.player.boosting = false;this.player.grapple=null;this.player.tailTime=0;
    const total = this.level.collectibles.filter(x => x.type === 'crystal').length;
    const stars = won ? 1 + Number(this.crystals >= Math.ceil(total * 0.85)) + Number(this.elapsed <= this.level.mission.par) : 0;
    const timeBonus = this.mode === 'campaign' && won ? Math.max(0, Math.floor((this.level.mission.par - this.elapsed) * 10)) : 0;
    this.result = { won, reason, mode: this.mode, index: this.index, character: this.character, score: this.score + timeBonus, crystals: this.crystals, total, relics: this.relics, elapsed: this.elapsed, height: Math.floor(this.maxHeight), stars, assist: this.assist };
    this.emit('finish', { result: this.result });
  }
  step(dt, input = {}) {
    if (this.state !== 'playing') return;
    this.elapsed += dt;
    if (this.mode === 'endless' && this.elapsed >= 120) { this.elapsed = 120; this.finish(true, 'time'); return; }
    const p = this.player;
    p.invulnerable = Math.max(0, p.invulnerable - dt); p.landing = Math.max(0, p.landing - dt);
    for (const platform of this.level.platforms) {
      const before = platform.x;
      platform.previousY = platform.y;
      if (platform.amplitude) platform.x = platform.baseX + Math.sin(this.elapsed * platform.speed + platform.phase) * platform.amplitude;
      if (platform.rise) platform.y = platform.baseY + (1-Math.cos(this.elapsed * platform.speed)) * platform.rise / 2;
      if (p.grounded && p.groundId === platform.id) {
        p.x += platform.x - before; p.y += platform.y - platform.previousY; p.lastLandY = platform.y;
      }
      if (platform.crumble > 0 && !platform.broken) {
        platform.crumble -= dt;
        if (platform.crumble <= 0) { platform.broken = true; platform.recover = 3; this.emit('crumble', {x: platform.x, y: platform.y}); }
      }
      if (platform.broken) { platform.recover -= dt; if (platform.recover <= 0) {platform.broken = false;platform.crumble = 0;} }
    }
    const ground = this.platform(p.groundId);
    if (p.grounded && (!ground || ground.broken || Math.abs(p.x - ground.x) > ground.w / 2 + p.w / 2)) { p.grounded = false; p.groundId = -1; }
    p.coyote = p.grounded ? PHYSICS.coyote : Math.max(0, p.coyote - dt);
    const canLaunch=p.grounded||p.coyote>0;
    if (input.jump) p.buffer = PHYSICS.buffer;
    else p.buffer = Math.max(0, p.buffer - dt);
    if (p.buffer > 0) {
      if (p.grounded || p.coyote > 0) {
        p.vy = PHYSICS.jump; p.jumps = 1; p.grounded = false; p.groundId = -1; p.coyote = 0; p.buffer = 0; this.emit('jump', { x: p.x, y: p.y });
      } else if (p.jumps < 2) {
        p.vy = PHYSICS.jump; p.jumps = 2; p.buffer = 0; this.emit('double', { x: p.x, y: p.y });
      }
    }
    if (input.jumpReleased && p.vy > 240 && !input.boost && p.tailTime<=0 && !p.grapple) p.vy *= 0.65;
    const axis = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if(!p.grapple)p.vx = approach(p.vx, axis * PHYSICS.speed, PHYSICS.acceleration * dt * (p.grounded ? 1 : 0.8));
    if (axis) p.facing = axis;
    const oldY = p.y;
    updateAbility(this,input,dt,canLaunch);
    p.x = clamp(p.x + p.vx * dt, p.w / 2 + 8, WORLD_WIDTH - p.w / 2 - 8);
    if (!p.grounded) { p.vy = Math.max(-690, p.vy - this.level.gravity * dt); p.y += p.vy * dt; }
    if (!p.grounded) {
      // Sweep relative to each moving surface. The earliest crossing wins, so
      // a rising lift catches feet and a fast fall cannot tunnel through it.
      let landing = null, firstCrossing = Infinity;
      for (const platform of this.level.platforms) {
        const before = oldY-platform.previousY, after = p.y-platform.y;
        if (platform.broken || before < -.2 || after > 0 || after >= before || Math.abs(p.x-platform.x) > platform.w/2+p.w*.42) continue;
        const crossing = Math.max(0,before)/(before-after);
        if (crossing < firstCrossing) { landing = platform; firstCrossing = crossing; }
      }
      if (landing) {
        p.y = landing.y; p.vy = 0; p.grounded = true; p.groundId = landing.id; p.jumps = 0; p.coyote = PHYSICS.coyote; p.lastLandY = landing.y;
        p.lastPlatformId=landing.id;p.grapple=null;
        if(this.character!=='nova')p.fuel=100;
        p.landing = .08; this.emit('land', {x:p.x,y:p.y});
        if (landing.type === 'refuel') { p.fuel = 100; this.emit('refuel', {x:p.x,y:p.y}); }
      }
    }
    const landedOn = this.platform(p.groundId);
    if (p.grounded && landedOn) {
      if (landedOn.type === 'fragile' && landedOn.crumble === 0) landedOn.crumble = .7;
      if (landedOn.type === 'checkpoint' && landedOn.id > this.checkpoint) {
        this.checkpoint = landedOn.id; p.fuel = 100; this.emit('checkpoint', {x:landedOn.x,y:landedOn.y,id:landedOn.id});
      }
    }
    this.maxHeight = Math.max(this.maxHeight, p.y);
    for (const item of this.level.collectibles) {
      if (this.collected.has(item.id)) continue;
      const platform = this.platform(item.platformId); item.x = platform.x + item.offsetX; item.y = platform.y + item.offsetY;
      if (Math.abs(item.y - p.y) > 100) continue;
      const distance = Math.hypot(p.x - item.x, p.y + 23 - item.y);
      if (distance < (this.assist ? 43 : 32)) { this.collected.add(item.id); if (item.type === 'shield') this.health = Math.min(this.maxHealth, this.health + 1); this.emit(item.type, {x: item.x, y: item.y}); }
    }
    for (const enemy of this.level.enemies) {
      stepEnemy(enemy, dt, p.y, this.level.platforms, this.assist);
      const contact = enemyContact(enemy, p, oldY);
      if (contact === 'bonk') {
        enemy.stunned = 4; p.y = enemy.y + enemy.radius; p.vy = 385;
        p.grounded = false; p.groundId = -1; p.jumps = 1; p.coyote = 0;
        this.emit('bonk', { x: enemy.x, y: enemy.y, enemy: enemy.type });
      } else if (contact === 'hurt') {
        const health = this.health; this.damage(enemy.type);
        if (this.state === 'ended') return;
        if (this.health !== health) break;
      }
    }
    if (p.y < -100 || p.y < p.lastLandY - 390) { this.damage('fall'); if (p.invulnerable > 0 && p.y < -160) this.respawn(); if (this.state === 'ended') return; }
    if (this.mode === 'campaign') {
      const goal = this.level.goal;
      if (Math.abs(p.x - goal.x) < 40 && Math.abs(p.y - goal.y) < 65) {
        if (this.crystals >= goal.required) this.finish(true);
        else if (this.elapsed - this.goalHintAt > 5) { this.goalHintAt = this.elapsed; this.emit('goalLocked', { missing: goal.required - this.crystals }); }
      }
    }
  }
}
