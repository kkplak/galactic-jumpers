/** Predictable little creatures. No pursuit or random attacks. */
export function createEnemy(type, options = {}) {
  const enemy = {
    type, id: '', x: 240, y: 500, baseX: 240, baseY: 500,
    amplitude: 90, speed: .75, phase: 0, age: 0, stunned: 0,
    facing: 1, warning: false, state: 'idle', hidden: false,
    radius: type === 'crawler' ? 16 : 15, ...options,
  };
  enemy.x = enemy.baseX; enemy.y = enemy.baseY;
  if (type === 'swooper') { enemy.x = enemy.phase ? 432 : 48; enemy.warning = true; enemy.state = 'warning'; }
  return enemy;
}

export function stepEnemy(enemy, dt, playerY, platforms, assist = false) {
  enemy.previousY = enemy.y;
  enemy.stunned = Math.max(0, enemy.stunned - dt);
  const platform = platforms[enemy.platformId];
  enemy.hidden = !!platform?.broken;
  // A newly approached flyer always gives its warning before its first dash.
  if (Math.abs(playerY - (platform?.y ?? enemy.baseY)) > 420) return;
  enemy.age += dt * (assist ? .65 : 1);
  const age = enemy.age;
  enemy.warning = false;
  if (enemy.type === 'crawler' || enemy.type === 'hopper') {
    if (!platform) { enemy.hidden = true; return; }
    const travel = Math.max(0, platform.w / 2 - 30);
    const phase = age * (enemy.type === 'crawler' ? 1.1 : .6) + enemy.phase;
    enemy.x = platform.x + Math.sin(phase) * travel;
    enemy.facing = Math.cos(phase) >= 0 ? 1 : -1;
    enemy.y = platform.y + 17;
    enemy.state = 'walk';
    if (enemy.type === 'hopper') {
      const cycle = age % 3.5;
      enemy.warning = cycle >= 1.85 && cycle < 2.4;
      enemy.state = cycle >= 2.4 ? 'hop' : enemy.warning ? 'crouch' : 'idle';
      if (enemy.state === 'hop') enemy.y += Math.sin((cycle - 2.4) / 1.1 * Math.PI) * 90;
    }
  } else if (enemy.type === 'swooper') {
    const pass = Math.floor(age / 6.4), cycle = age % 6.4;
    enemy.facing = (pass % 2 ? -1 : 1) * (enemy.phase ? -1 : 1);
    const from = enemy.facing > 0 ? 48 : 432, to = 480 - from;
    enemy.warning = cycle < 1.2;
    enemy.state = enemy.warning ? 'warning' : cycle < 3 ? 'dash' : 'rest';
    const progress = Math.max(0, Math.min(1, (cycle - 1.2) / 1.8));
    enemy.x = from + (to - from) * progress;
    enemy.y = enemy.baseY;
  } else {
    enemy.x = enemy.baseX + Math.sin(age * enemy.speed + enemy.phase) * enemy.amplitude;
    enemy.y = enemy.baseY + Math.sin(age * 1.4 + enemy.phase) * 10;
    enemy.facing = Math.cos(age * enemy.speed + enemy.phase) >= 0 ? 1 : -1;
    enemy.state = 'patrol';
  }
}

export function enemyContact(enemy, player, oldY) {
  if (enemy.hidden || enemy.stunned > 0) return null;
  const nearX = Math.abs(player.x - enemy.x) < player.w / 2 + enemy.radius - 3;
  if (!nearX) return null;
  const top = enemy.y + enemy.radius;
  const previousTop = (enemy.previousY ?? enemy.y) + enemy.radius;
  if ((enemy.type === 'crawler' || enemy.type === 'hopper') && player.vy < 0 && oldY >= previousTop - 4 && player.y <= top && player.y >= top - 18) return 'bonk';
  return player.y < top && player.y + player.h > enemy.y - enemy.radius ? 'hurt' : null;
}
